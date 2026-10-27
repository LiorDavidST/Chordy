// Chordy 2.0 zero-cost catalog: versioned, per-browser cache.
// This is not a shared server database. No YouTube audio is downloaded.
const PREFIX='chordy:v2:';
const VALID_ID=/^[a-zA-Z0-9_-]{11}$/;
const VALID_CHORD=/^[A-G](?:#|b)?(?:maj7|m7|m|7|dim|sus2|sus4)?$/;
export function catalogKey(videoId){if(!VALID_ID.test(videoId))throw Error('Invalid YouTube video ID');return PREFIX+videoId}
export function normalizeAnalysis(videoId,events,meta={}){
  catalogKey(videoId);
  if(!Array.isArray(events)||events.length>20000)throw Error('Invalid chord timeline');
  const normalized=events.map(e=>({time:Number(e.time),name:e.name})).filter(e=>Number.isFinite(e.time)&&e.time>=0&&e.time<=21600&&VALID_CHORD.test(e.name)).sort((a,b)=>a.time-b.time);
  if(!normalized.length)throw Error('No valid chords');
  return {schema:'chordy.analysis/2',videoId,events:normalized,source:meta.source||'unknown',method:meta.method||'unspecified',createdAt:new Date().toISOString(),duration:Number.isFinite(meta.duration)?meta.duration:null};
}
export function saveAnalysis(storage,videoId,events,meta={}){
  const analysis=normalizeAnalysis(videoId,events,meta);
  storage.setItem(catalogKey(videoId),JSON.stringify(analysis));
  return analysis;
}
export function loadAnalysis(storage,videoId){
  const raw=storage.getItem(catalogKey(videoId));if(!raw)return null;
  try{
    const value=JSON.parse(raw);
    if(value.schema!=='chordy.analysis/2'||value.videoId!==videoId)return null;
    return normalizeAnalysis(videoId,value.events,{source:value.source,method:value.method,duration:value.duration});
  }catch{return null}
}
export function removeAnalysis(storage,videoId){storage.removeItem(catalogKey(videoId))}
