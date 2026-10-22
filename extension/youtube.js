let started=true,lastVideoId='';
function videoId(){return new URL(location.href).searchParams.get('v')||''}
function report(){if(!started)return;const video=document.querySelector('video');if(!video)return;const id=videoId();if(!id)return;chrome.runtime.sendMessage({type:'CHORDY_VIDEO_STATE',payload:{type:'video',videoId:id,time:video.currentTime,duration:Number.isFinite(video.duration)?video.duration:null,paused:video.paused,title:document.title}}).catch(()=>{})}
chrome.runtime.onMessage.addListener(msg=>{if(msg.type==='CHORDY_STARTED'){started=true;report()}});
setInterval(()=>{const id=videoId();if(id!==lastVideoId){lastVideoId=id;if(started)report()}report()},500);
