// Chorduction-compatible import adapter. No access to YouTube media or browser extensions.
export function importChordMap(input){let parsed;try{parsed=JSON.parse(input)}catch{throw Error('קובץ JSON לא תקין')}
const raw=Array.isArray(parsed)?parsed:parsed.timeline||parsed.chords||parsed.segments||parsed.events;
if(!Array.isArray(raw))throw Error('לא נמצאה רשימת אקורדים בפורמט הנתמך');
const output=[];for(const item of raw){if(!item||typeof item!=='object')continue;const t=item.time??item.start??(item.startMs!=null?item.startMs/1000:undefined)??(item.start_ms!=null?item.start_ms/1000:undefined);const chord=item.chord??item.name??item.label;const n=Number(t);if(!Number.isFinite(n)||n<0||typeof chord!=='string'||!/^([A-G])([#b]?)(maj7|m7|m|7|dim|sus2|sus4)?$/.test(chord))continue;output.push({time:Math.round(n*100)/100,name:chord})}if(!output.length)throw Error('לא נמצאו אקורדים תקינים בפורמט הנתמך');return output.sort((a,b)=>a.time-b.time)}
