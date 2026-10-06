import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mascotMutation,mascotAnchor} from '../src/lib/mascotAction.js';

test('visual completion precedes exactly one data write and cleanup receives its outcome',async()=>{
  const calls=[];
  const result=await mascotMutation({play:async()=>calls.push('draw'),commit:async()=>{calls.push('save');return true;},cleanup:success=>calls.push(success?'done':'restore')});
  assert.equal(result,true);assert.deepEqual(calls,['draw','save','done']);
});
test('a cancelled visual still performs the requested data write once',async()=>{
  let writes=0,cleaned=false;
  await mascotMutation({play:async()=>{throw new Error('animation cancelled');},commit:async()=>{writes++;},cleanup:success=>{cleaned=success;}});
  assert.equal(writes,1);assert.equal(cleaned,true);
});
test('failed deletion restores the visual while preserving the actual backend error',async()=>{
  const expected=new Error('permission-denied');let outcome=null,writes=0;
  await assert.rejects(mascotMutation({play:async()=>{},commit:async()=>{writes++;throw expected;},cleanup:success=>{outcome=success;}}),error=>error===expected);
  assert.equal(writes,1);assert.equal(outcome,false);
});
test('handled UI failures return false and never become successful mascot completion',async()=>{
  let outcome=true;
  assert.equal(await mascotMutation({commit:async()=>false,cleanup:success=>{outcome=success;}}),false);assert.equal(outcome,false);
});
test('cleanup failure cannot hide the original mutation failure or cause a retry',async()=>{
  let writes=0;
  await assert.rejects(mascotMutation({commit:async()=>{writes++;throw new Error('original');},cleanup:()=>{throw new Error('cleanup');}}),/original/);assert.equal(writes,1);
});
test('pencil approach uses the opposite side near screen edges and stays inside the viewport',()=>{
  const near=mascotAnchor({left:30,right:180,top:100,height:20},400,500);
  assert.equal(near.reverse,true);assert.ok(near.x>=4 && near.x<=292);
  const middle=mascotAnchor({left:250,right:360,top:900,height:20},800,500);
  assert.equal(middle.reverse,false);assert.equal(middle.y,392);
});
