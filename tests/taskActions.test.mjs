import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taskCompletionPatch, taskTabs, applyClassTaskStates } from '../src/lib/taskActions.js';

test('completion preserves partial progress for undo without changing steps or notes', () => {
  const task = { id:'task', progress:62, details:'Keep notes', steps:[{progress:35}] };
  const completed = {...task,...taskCompletionPatch(task)};
  assert.equal(completed.progress,100);
  assert.equal(completed.previousProgress,62);
  assert.deepEqual({...completed,...taskCompletionPatch(completed)},{...task,previousProgress:null});
  assert.equal(task.progress,62);
  assert.equal(completed.steps[0].progress,35);
  assert.deepEqual(taskCompletionPatch({progress:100}),{progress:0,previousProgress:null});
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
