import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogKey,normalizeAnalysis,saveAnalysis,loadAnalysis,removeAnalysis} from '../src/chordCatalog.js';
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}
const id='dQw4w9WgXcQ';
test('round trip keeps sorted chords and provenance',()=>{
 const db=storage();
 const saved=saveAnalysis(db,id,[{time:8,name:'G'},{time:0,name:'C'}],{source:'user-import'});
 assert.deepEqual(saved.events,[{time:0,name:'C'},{time:8,name:'G'}]);
 const loaded=loadAnalysis(db,id);
 assert.equal(loaded.source,'user-import');
 assert.deepEqual(loaded.events,saved.events);
 removeAnalysis(db,id);assert.equal(loadAnalysis(db,id),null);
});
test('reject invalid ids and empty or malformed maps',()=>{
 assert.throws(()=>catalogKey('bad'));
 assert.throws(()=>normalizeAnalysis(id,[]));
 assert.throws(()=>normalizeAnalysis(id,[{time:-1,name:'C'}]));
 assert.throws(()=>normalizeAnalysis(id,[{time:1,name:'NOT_A_CHORD'}]));
});
test('corrupted cache cannot crash the player',()=>{
 const db=storage();db.setItem(catalogKey(id),'{bad');
 assert.equal(loadAnalysis(db,id),null);
});
test('cache is keyed by video, not title',()=>{
 const db=storage();saveAnalysis(db,id,[{time:0,name:'Am'}]);
 assert.equal(loadAnalysis(db,'aBcDeFgHiJ1'),null);
});
