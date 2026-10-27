// Experimental beat tracker POC. This is not a trained model.
// Detects transient peaks from frame-to-frame energy changes.
export function estimateBeatGrid(samples,sampleRate){
 if(!samples||!Number.isFinite(sampleRate)||sampleRate<=0)return {bpm:null,beats:[],method:'onset-energy-poc'};
 const hop=Math.max(1,Math.round(sampleRate*.02)),size=hop*2,novelty=[];
 for(let i=0;i+size<=samples.length;i+=hop){
  let e=0;for(let j=i;j<i+size;j++)e+=samples[j]*samples[j];
  novelty.push(Math.sqrt(e/size));
 }
 if(novelty.length<100)return {bpm:null,beats:[],method:'onset-energy-poc'};
 const flux=novelty.map((v,i)=>Math.max(0,v-(novelty[i-1]||0)));
 const peaks=[];for(let i=3;i<flux.length-3;i++){
  const lo=Math.max(0,i-25),hi=Math.min(flux.length,i+26);
  let mean=0;for(let j=lo;j<hi;j++)mean+=flux[j];mean/=hi-lo;
  if(flux[i]>mean*2.5&&flux[i]>1e-4&&flux[i]>=flux[i-1]&&flux[i]>flux[i+1])peaks.push(i*hop/sampleRate);
 }
 let bestBpm=null,bestScore=0;
 for(let bpm=60;bpm<=180;bpm++){
  const period=60/bpm;let score=0;
  for(const t of peaks)for(const u of peaks){if(u<=t)continue;const delta=u-t;if(delta>5)break;
   const cycles=Math.round(delta/period);if(cycles<1||cycles>8)continue;
   const error=Math.abs(delta-cycles*period);
   if(error<.06)score+=(1-error/.06)/Math.sqrt(cycles);
  }
  if(score>bestScore){bestScore=score;bestBpm=bpm}
 }
 if(peaks.length<4||bestScore<2)return {bpm:null,beats:[],method:'onset-energy-poc'};
 const period=60/bestBpm,phase=peaks[0],duration=samples.length/sampleRate,beats=[];
 for(let t=phase;t<duration&&beats.length<3000;t+=period)beats.push(Math.round(t*100)/100);
 return {bpm:bestBpm,beats,method:'onset-energy-poc',confidence:'experimental'};
}
