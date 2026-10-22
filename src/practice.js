export const PITCHES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export function transposeChord(name,semitones=0){const m=/^([A-G])([#b]?)(.*)$/.exec(name||'');if(!m)return name;const root=PITCHES.indexOf(m[1]);const shift=m[2]==='#'?1:m[2]==='b'?-1:0;return PITCHES[(root+shift+Number(semitones)+120)%12]+m[3]}
export function formatTime(time){const t=Math.max(0,Math.floor(Number(time)||0));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
export function parseChordTimeline(text){const out=[];for(const line of text.split(/\r?\n/)){if(!line.trim())continue;const match=/^\s*(\d+(?:\.\d+)?)\s*,\s*([A-G](?:#|b)?(?:maj7|m7|m|7|dim|sus2|sus4)?)\s*$/.exec(line);if(!match)throw Error('שורה לא תקינה: '+line);out.push({time:Number(match[1]),name:match[2]})}return out.sort((a,b)=>a.time-b.time)}
export function exportTimeline(events){return events.map(e=>e.time+','+e.name).join('\n')}
export function currentChordIndex(events,time){let low=0,high=events.length-1,result=-1;while(low<=high){const mid=(low+high)>>1;if(events[mid].time<=time){result=mid;low=mid+1}else high=mid-1}return result}
