import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {taskGridEntries,taskDayLayout} from '../src/lib/taskGrid.js';

const task=(id,from,to,extra={})=>({id,title:id,start:'2026-10-06',end:'2026-10-06',allDay:false,startTime:from,endTime:to,timeZone:'Asia/Bangkok',progress:0,steps:[],...extra});
const day=date=>new Date(`${date}T00:00:00+07:00`);
test('grid modes retain parent/step identity, notes and progress without changing source tasks',()=>{
  const source=task('parent','09:00','12:00',{steps:[task('step','10:00','11:00',{details:'Keep notes',progress:100})]});
  assert.equal(taskGridEntries([source],'tasks').entries.length,1);
  const steps=taskGridEntries([source],'steps').entries;
  assert.equal(steps.length,1);assert.equal(steps[0].stepId,'step');assert.equal(steps[0].task.id,'parent');assert.equal(steps[0].item.details,'Keep notes');assert.equal(steps[0].item.progress,100);
  assert.equal(taskGridEntries([source],'both').entries.length,2);assert.equal(source.steps[0].startTime,'10:00');
});
test('overnight tasks are split at midnight and end-exclusive boundaries never add a phantom day',()=>{
  const entries=taskGridEntries([task('night','23:00','01:00',{end:'2026-10-07'})]).entries;
  const first=taskDayLayout(entries,day('2026-10-06'),'Asia/Bangkok')[0],second=taskDayLayout(entries,day('2026-10-07'),'Asia/Bangkok')[0];
  assert.equal(first.startMinute,1380);assert.equal(first.endMinute,1440);assert.equal(first.toLabel,'24:00');assert.equal(second.startMinute,0);assert.equal(second.endMinute,60);
  const midnight=taskGridEntries([task('end','23:00','00:00',{end:'2026-10-07'})]).entries;
  assert.equal(taskDayLayout(midnight,day('2026-10-07'),'Asia/Bangkok').length,0);
});
test('overlapping tasks use separate lanes and later independent clusters regain full width',()=>{
  const entries=taskGridEntries([task('a','09:00','11:00'),task('b','10:00','12:00'),task('c','11:00','12:30'),task('d','13:00','14:00')]).entries;
  const layout=taskDayLayout(entries,day('2026-10-06'),'Asia/Bangkok');
  assert.equal(layout[0].lanes,2);assert.notEqual(layout[0].lane,layout[1].lane);assert.equal(layout[2].lane,layout[0].lane);assert.equal(layout[3].lanes,1);
});
test('all-day tasks retain the same calendar dates for a viewer in another timezone',()=>{
  const entries=taskGridEntries([{id:'day',title:'day',start:'2026-10-06',end:'2026-10-07',allDay:true,timeZone:'Asia/Bangkok'}],'tasks','America/New_York').entries;
  assert.equal(DateTime.fromMillis(entries[0].start,{zone:'America/New_York'}).toISODate(),'2026-10-06');assert.equal(DateTime.fromMillis(entries[0].end,{zone:'America/New_York'}).toISODate(),'2026-10-08');
  assert.equal(taskDayLayout(entries,day('2026-10-06'),'Asia/Bangkok').length,0);
});
test('timed tasks appear on the viewer clock and invalid schedules are reported separately',()=>{
  const entries=taskGridEntries([task('utc','02:00','03:00',{timeZone:'UTC'}),task('invalid','bad','10:00')]);
  assert.equal(entries.entries.length,1);assert.deepEqual(entries.errors,['invalid']);
  const layout=taskDayLayout(entries.entries,day('2026-10-06'),'Asia/Bangkok');assert.equal(layout[0].fromLabel,'09:00');assert.equal(layout[0].toLabel,'10:00');
});
