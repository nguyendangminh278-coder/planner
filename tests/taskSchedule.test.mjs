import {test} from 'node:test';
import assert from 'node:assert/strict';
import {taskForm,taskScheduleData,scheduleInterval,taskTimeLabel,taskRangeLabel} from '../src/lib/taskSchedule.js';
import {taskCompletionPatch,stepCompletionPatch} from '../src/lib/taskActions.js';

const timed = {title:'Timed task',start:'2026-10-06',end:'2026-10-06',allDay:false,startTime:'09:00',endTime:'17:00',timeZone:'Asia/Bangkok',progress:0,details:'Keep notes',color:'#cffafe',steps:[]};
test('legacy tasks and steps open as all-day without inventing saved hours', () => {
  const form = taskForm({...timed,allDay:undefined,startTime:undefined,endTime:undefined,steps:[{id:'a',title:'Step',start:timed.start,end:timed.end,progress:25,details:'Step notes'}]},timed.start);
  assert.equal(form.allDay,true); assert.equal(form.steps[0].allDay,true);
  const saved = taskScheduleData(form);
  assert.equal(saved.startTime,null); assert.equal(saved.endTime,null); assert.equal(saved.steps[0].startTime,null);
  assert.equal(taskTimeLabel({start:timed.start,end:timed.end}),'Cả ngày');
});
test('timed task and step ranges retain dates, hours, timezone and notes across an edit', () => {
  const form = {...timed,steps:[{...timed,id:'a',title:'Step',startTime:'10:00',endTime:'11:00',details:'Step notes'}]};
  const saved = taskScheduleData(form);
  assert.equal(saved.startTime,'09:00'); assert.equal(saved.steps[0].startTime,'10:00'); assert.equal(saved.steps[0].details,'Step notes');
  const edited = taskScheduleData(taskForm(saved,timed.start));
  assert.deepEqual(edited,saved);
  assert.ok(taskRangeLabel(saved).includes('09:00–17:00'));
});
test('invalid dates, missing clocks, reversed intervals and steps outside the timed parent are rejected', () => {
  for (const patch of [{start:'2026-02-30'},{startTime:'25:00'},{endTime:''},{endTime:'09:00'},{endTime:'08:00'},{timeZone:'Unknown/Zone'}]) assert.throws(() => taskScheduleData({...timed,...patch}));
  for (const step of [{...timed,startTime:'08:59'}, {...timed,endTime:'17:01'}, {...timed,allDay:true}]) assert.throws(() => taskScheduleData({...timed,steps:[{...step,id:'a',title:'Step'}]}));
});
test('overnight ranges use the next end date and allow contained overnight steps', () => {
  const form = {...timed,startTime:'22:00',end:'2026-10-07',endTime:'06:00',steps:[{...timed,id:'a',title:'Night step',startTime:'23:00',end:'2026-10-07',endTime:'02:00'}]};
  assert.equal(scheduleInterval(taskScheduleData(form)).end-scheduleInterval(form).start,8*60*60*1000);
  assert.ok(taskRangeLabel(form).includes('07/10/2026 06:00'));
});
test('all-day dates are inclusive and respect calendar days across daylight-saving transitions', () => {
  const form = {...timed,start:'2026-03-08',end:'2026-03-08',allDay:true,timeZone:'America/New_York'};
  const range = scheduleInterval(form);
  assert.equal(range.end-range.start,23*60*60*1000);
  assert.throws(() => scheduleInterval({...form,allDay:false,startTime:'02:30',endTime:'04:00'}));
});
test('completion, undo and step checks preserve all schedule fields', () => {
  const original = {...timed,steps:[{...timed,id:'a',title:'Step',startTime:'10:00',endTime:'11:00',progress:20}]};
  const done = {...original,...taskCompletionPatch(original)};
  assert.equal(done.startTime,'09:00'); assert.equal(done.steps[0].startTime,'10:00');
  const undo = {...done,...taskCompletionPatch(done)};
  assert.equal(undo.steps[0].endTime,'11:00');
  const one = {...original,...stepCompletionPatch(original,'a')};
  assert.equal(one.steps[0].timeZone,'Asia/Bangkok'); assert.equal(one.progress,100);
});
