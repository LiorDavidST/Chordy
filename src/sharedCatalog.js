// Public read-only Supabase catalog. Never put privileged keys in this client.
const BASE='https://srgdcrheigrkuhkpsfmo.supabase.co/rest/v1';
const KEY='sb_publishable_MrGreNgkeUFD235ygBz25w_WYfDd93-';
const ID=/^[A-Za-z0-9_-]{11}$/;
async function get(path){
 const response=await fetch(BASE+path,{headers:{apikey:KEY,Accept:'application/json'}});
 if(!response.ok)throw Error('Supabase catalog HTTP '+response.status);
 return response.json();
}
export async function fetchSharedChordMap(videoId){
 if(!ID.test(videoId))throw Error('Invalid YouTube video ID');
 const songs=await get('/songs?youtube_video_id=eq.'+encodeURIComponent(videoId)+'&select=id&limit=1');
 if(!songs.length)return null;
 const analyses=await get('/chord_analyses?song_id=eq.'+songs[0].id+'&select=id,method,source,bpm&order=created_at.desc&limit=1');
 if(!analyses.length)return null;
 const events=await get('/chord_events?analysis_id=eq.'+analyses[0].id+'&select=time_seconds,chord_name&order=time_seconds.asc&limit=2000');
 if(!events.length)return null;
 return {events:events.map(e=>({time:Number(e.time_seconds),name:e.chord_name})),method:analyses[0].method,source:analyses[0].source,bpm:analyses[0].bpm};
}
