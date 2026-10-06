import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskCompletionPatch, stepCompletionPatch, stepsProgress, taskTabs, applyClassTaskStates } from '../src/lib/taskActions.js';

test('whole-task completion finishes steps and undo restores their partial progress and notes', () => {
  const task = { id:'task', progress:62, details:'Keep notes', steps:[{progress:35}] };
  const completed = {...task,...taskCompletionPatch(task)};
  assert.equal(completed.progress,100);
  assert.equal(completed.previousProgress,62);
  assert.deepEqual({...completed,...taskCompletionPatch(completed)},{...task,previousProgress:null,steps:[{progress:35,previousProgress:null}]});
  assert.equal(task.progress,62);
  assert.equal(completed.steps[0].progress,100);
  assert.equal(completed.steps[0].previousProgress,35);
  assert.deepEqual(taskCompletionPatch({progress:100}),{progress:0,previousProgress:null});
  assert.deepEqual(taskCompletionPatch({progress:'45'}),{progress:100,previousProgress:45});
});

test('individual steps finish the whole task only when every step is complete; reopening restores partial progress', () => {
  const original = {progress:35,details:'Keep task notes',steps:[{id:'a',progress:50,details:'Keep step notes'},{id:'b',progress:20}]};
  const one = {...original,...stepCompletionPatch(original,'a')};
  assert.equal(one.progress,60);
  assert.equal(one.steps[0].progress,100);
  assert.equal(one.steps[1].progress,20);
  const all = {...one,...stepCompletionPatch(one,'b')};
  assert.equal(all.progress,100);
  const reopened = {...all,...stepCompletionPatch(all,'a')};
  assert.equal(reopened.progress,75);
  assert.equal(reopened.steps[0].progress,50);
  assert.equal(reopened.steps[1].progress,100);
  assert.equal(reopened.steps[0].details,'Keep step notes');
  assert.equal(reopened.details,'Keep task notes');
  assert.equal(original.steps[0].progress,50);
});

test('whole-task undo preserves steps already finished before batch completion', () => {
  const original = {progress:62,steps:[{id:'a',progress:100},{id:'b',progress:35}]};
  const done = {...original,...taskCompletionPatch(original)};
  const undo = {...done,...taskCompletionPatch(done)};
  assert.equal(undo.progress,62);
  assert.equal(undo.steps[0].progress,100);
  assert.equal(undo.steps[1].progress,35);
  const individuallyDone = {...original,...stepCompletionPatch(original,'b')};
  const reopened = taskCompletionPatch(individuallyDone);
  assert.equal(reopened.steps[0].progress,100);
  assert.equal(reopened.steps[1].progress,35);
  assert.equal(reopened.progress,68);
  const alreadyChecked = {progress:80,steps:[{id:'a',progress:100,previousProgress:50},{id:'b',progress:60}]};
  const batch = {...alreadyChecked,...taskCompletionPatch(alreadyChecked)};
  const restored = taskCompletionPatch(batch);
  assert.equal(restored.steps[0].progress,100);
  assert.equal(restored.steps[0].previousProgress,50);
  assert.equal(restored.steps[1].progress,60);
  assert.equal(restored.progress,80);
});

test('legacy completed trees without undo history can be reopened and rounding never prematurely completes a task', () => {
  const legacy = {progress:100,steps:[{id:'a',progress:100},{id:'b',progress:100}]};
  const reopened = taskCompletionPatch(legacy);
  assert.equal(reopened.progress,0);
  assert.ok(reopened.steps.every(step => step.progress === 0));
  assert.equal(stepsProgress([{progress:100},{progress:99.9}]),99);
  assert.throws(() => stepCompletionPatch(legacy,'missing'));
});

test('completing a task retains its original date tab and also includes it in completed', () => {
  const tasks = [{id:'today',start:'2026-10-01',progress:100},{id:'future',start:'2026-10-10',progress:100},{id:'pending',start:'2026-10-05',progress:20}];
  const tabs = taskTabs(tasks,'2026-10-06');
  assert.deepEqual(tabs.today.map(t=>t.id),['today','pending']);
  assert.deepEqual(tabs.upcoming.map(t=>t.id),['future']);
  assert.deepEqual(tabs.completed.map(t=>t.id),['today','future']);
});

test('class states hide only deleted tasks, retain completed tasks and never alter the source or class events', () => {
  const items = [{id:'class:a',kind:'task'},{id:'class:b',kind:'task'},{id:'class:c',kind:'event'},{id:'class:d',kind:'task'}];
  const states = {'class:a':{completed:true},'class:b':{deleted:true},'class:c':{deleted:true,completed:true}};
  const visible = applyClassTaskStates(items,states);
  assert.deepEqual(visible.map(i=>i.id),['class:a','class:c','class:d']);
  assert.equal(visible[0].completed,true);
  assert.equal(visible[1].completed,undefined);
  assert.equal(visible[2].completed,false);
  assert.equal(items[0].completed,undefined);
  assert.equal(applyClassTaskStates(items,{}).length,4);
});
