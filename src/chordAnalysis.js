// Local, permission-based harmonic analysis. No server uploads.
const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const TEMPLATES=[];
for(let root=0;root<12;root++)for(const [suffix,steps] of [['',[0,4,7]],['m',[0,3,7]],['7',[0,4,7,10]],['m7',[0,3,7,10]],['maj7',[0,4,7,11]]]){const mask=Array(12).fill(0);for(const s of steps)mask[(root+s)%12]=1;TEMPLATES.push({name:NAMES[root]+suffix,mask})}
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}for(let len=2;len<=n;len*=2){const angle=-2*Math.PI/len,wr=Math.cos(angle),wi=Math.sin(angle);for(let i=0;i<n;i+=len){let r=1,v=0;for(let j=0;j<len/2;j++){const a=i+j,b=a+len/2,tr=re[b]*r-im[b]*v,ti=re[b]*v+im[b]*r;re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;const nr=r*wr-v*wi;v=r*wi+v*wr;r=nr}}}}
function classify(chroma){const sum=chroma.reduce((a,b)=>a+b,0);if(sum<1e-5)return null;let best=null,score=-Infinity,runner=-Infinity;for(const t of TEMPLATES){let inside=0,outside=0;for(let i=0;i<12;i++)(t.mask[i]?inside+=chroma[i]:outside+=chroma[i]);const s=inside/Math.sqrt(t.mask.reduce((a,b)=>a+b,0))-outside*.12;if(s>score){runner=score;score=s;best=t.name}else if(s>runner)runner=s}return {name:best,confidence:Math.max(0,Math.min(1,(score-runner)/(Math.abs(score)+1e-6)*2))}}
export async function analyzeAudio(file,onProgress=()=>{}){if(!file||!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name))throw Error('בחר קובץ שמע');if(file.size>75*1024*1024)throw Error('מגבלת גודל: 75MB');const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('הדפדפן אינו תומך בניתוח שמע');const ctx=new Context();let buffer;try{buffer=await ctx.decodeAudioData(await file.arrayBuffer())}finally{await ctx.close()}if(buffer.duration>900)throw Error('מגבלת משך: 15 דקות');const rate=buffer.sampleRate,n=4096,hop=Math.max(1024,Math.round(rate*.5)),channel=buffer.getChannelData(0),frames=[];for(let pos=0;pos+n<channel.length;pos+=hop){const re=new Float64Array(n),im=new Float64Array(n);for(let i=0;i<n;i++)re[i]=channel[pos+i]*(.5-.5*Math.cos(2*Math.PI*i/(n-1)));fft(re,im);const chroma=new Float64Array(12);let energy=0;for(let k=Math.ceil(65*n/rate);k<Math.min(n/2,Math.floor(1800*n/rate));k++){const freq=k*rate/n,midi=69+12*Math.log2(freq/440),pitch=Math.round(midi);if(Math.abs(midi-pitch)>.35)continue;const magnitude=Math.hypot(re[k],im[k]);chroma[(pitch%12+12)%12]+=magnitude;energy+=magnitude}const match=energy>1?classify(chroma):null;frames.push({time:pos/rate,...(match||{name:null,confidence:0})});if(frames.length%100===0){onProgress(Math.min(99,Math.round(pos/channel.length*100)));await new Promise(resolve=>setTimeout(resolve,0))}}
// Stabilize the raw half-second predictions before emitting chord changes.
// Short-lived labels are usually attacks, percussion or spectral leakage,
// not real harmonic changes. Do not claim these estimates are ground truth.
const frameStep=hop/rate;
const smoothRadius=2;
const smoothed=frames.map((f,i)=>{
  const votes=new Map();
  for(let j=Math.max(0,i-smoothRadius);j<=Math.min(frames.length-1,i+smoothRadius);j++){
    const v=frames[j];if(!v.name)continue;
    const proximity=1/(1+Math.abs(i-j));
    votes.set(v.name,(votes.get(v.name)||0)+proximity*(0.5+Math.max(0,v.confidence)));
  }
  const name=[...votes].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  return {...f,name};
});
const runs=[];
for(const frame of smoothed){
  const last=runs[runs.length-1];
  if(last&&last.name===frame.name){last.count++;last.confidence+=frame.confidence}
  else runs.push({name:frame.name,start:frame.time,count:1,confidence:frame.confidence});
}
// Remove unstable changes shorter than about 1.5 seconds; merge them into
// their longer neighbor, preferring agreement on both sides.
const minFrames=Math.max(2,Math.round(1.5/frameStep));
for(let i=0;i<runs.length;i++){
  const run=runs[i];
  if(run.count>=minFrames||runs.length===1)continue;
  const prev=runs[i-1],next=runs[i+1];
  if(prev&&next&&prev.name===next.name){
    prev.count+=run.count+next.count;prev.confidence+=run.confidence+next.confidence;
    runs.splice(i,2);i=Math.max(-1,i-2);continue;
  }
  if(prev&&(!next||prev.count>=next.count)){
    prev.count+=run.count;prev.confidence+=run.confidence;runs.splice(i,1);i--;continue;
  }
  if(next){next.start=run.start;next.count+=run.count;next.confidence+=run.confidence;runs.splice(i,1);i--}
}
const changes=[];
let last=null;
for(const run of runs){
  if(!run.name||run.name===last)continue;
  changes.push({time:Math.round(run.start*10)/10,name:run.name,confidence:Math.round(Math.min(1,run.confidence/Math.max(1,run.count))*100)/100});
  last=run.name;
}
onProgress(100);
return {events:changes,duration:buffer.duration,method:'FFT chroma / weighted temporal smoothing',limitations:'Approximate harmony only. Requires authorized audio; YouTube IFrame does not provide audio for analysis.'}}
