import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateBeatGrid} from '../src/beatTracking.js';
test('silent audio does not fabricate a tempo',()=>{
 const result=estimateBeatGrid(new Float32Array(44100*4),44100);
 assert.equal(result.bpm,null);
 assert.deepEqual(result.beats,[]);
});
test('short clips are treated as insufficient evidence',()=>{
 const result=estimateBeatGrid(new Float32Array(100),44100);
 assert.equal(result.bpm,null);
});
test('invalid sample rate fails safely',()=>{
 const result=estimateBeatGrid(new Float32Array(1000),0);
 assert.equal(result.bpm,null);
});
