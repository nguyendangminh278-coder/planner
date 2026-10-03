import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { buildEventData, defaultRecurrence, presetRecurrence, expandEvents, validRecurrence, eventForm } from '../src/lib/recurrence.js';
import { sharedAvailability } from '../src/lib/availability.js';
import { weekDays, clipToWeek } from '../src/lib/date.js';

const zone = 'Asia/Bangkok';
const form = date => ({ title:'Recurring meeting', date, endDate:date, start:'09:00', end:'10:00', color:'#cffafe', allDay:false, timeZone:zone });
const master = (date,rule,options={}) => ({...buildEventData({...form(date),...options},rule),id:'series'});
const range = (from,to,timeZone=zone) => [DateTime.fromISO(from,{zone:timeZone}).toJSDate(),DateTime.fromISO(to,{zone:timeZone}).toJSDate()];
const dates = rows => rows.map(row => DateTime.fromISO(row.start,{zone}).toISODate());

test('daily count includes the first occurrence and stops after the requested total', () => {
  const rule = {...defaultRecurrence('2026-10-03','daily'),endType:'count',count:3};
  const event = master('2026-10-03',rule);
  const rows = expandEvents([event],...range('2026-10-01','2026-10-12'),zone);
  assert.deepEqual(dates(rows),['2026-10-03','2026-10-04','2026-10-05']);
  assert.equal(new Set(rows.map(row=>row.id)).size,3); assert.ok(rows.every(row=>row.seriesId==='series'&&row.sourceEvent===event));
});
test('custom weekly intervals align to the selected weekdays and retain count across viewed weeks', () => {
  const rule = {...defaultRecurrence('2026-10-05'),interval:2,weekdays:[1,3],endType:'count',count:5};
  const event = master('2026-10-05',rule);
  assert.deepEqual(dates(expandEvents([event],...range('2026-10-01','2026-11-10'),zone)),['2026-10-05','2026-10-07','2026-10-19','2026-10-21','2026-11-02']);
  assert.deepEqual(dates(expandEvents([event],...range('2026-10-19','2026-10-26'),zone)),['2026-10-19','2026-10-21']);
});
test('weekdays exclude weekends and an until date is inclusive in the creator timezone', () => {
  const rule = {...presetRecurrence('weekdays','2026-10-03'),endType:'until',untilDate:'2026-10-09'};
  assert.deepEqual(dates(expandEvents([master('2026-10-03',rule)],...range('2026-10-01','2026-10-20'),zone)),['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09']);
});
test('monthly date recurrence skips nonexistent dates and ordinal weekdays are calculated per month', () => {
  const byDate = {...defaultRecurrence('2026-01-31','monthly'),endType:'count',count:3};
  assert.deepEqual(dates(expandEvents([master('2026-01-31',byDate)],...range('2026-01-01','2026-06-01'),zone)),['2026-01-31','2026-03-31','2026-05-31']);
  const firstSaturday = {...presetRecurrence('monthly-weekday','2026-10-03'),endType:'count',count:3};
  assert.deepEqual(dates(expandEvents([master('2026-10-03',firstSaturday)],...range('2026-10-01','2027-01-01'),zone)),['2026-10-03','2026-11-07','2026-12-05']);
});
test('yearly leap-day recurrence only produces valid February 29 dates', () => {
  const rule = {...defaultRecurrence('2024-02-29','yearly'),endType:'count',count:2};
  assert.deepEqual(dates(expandEvents([master('2024-02-29',rule)],...range('2024-01-01','2029-01-01'),zone)),['2024-02-29','2028-02-29']);
});
test('daily wall-clock time is preserved across daylight-saving changes', () => {
  const ny = 'America/New_York';
  const rule = {...defaultRecurrence('2026-03-07','daily'),endType:'count',count:3};
  const rows = expandEvents([master('2026-03-07',rule,{timeZone:ny})],...range('2026-03-06','2026-03-11',ny),ny);
  assert.deepEqual(rows.map(row=>DateTime.fromISO(row.start,{zone:ny}).toFormat('HH:mm')),['09:00','09:00','09:00']);
  assert.equal(Date.parse(rows[1].start)-Date.parse(rows[0].start),23*3600000);
});
test('all-day recurrence uses calendar dates and blocks the entire comparison window', () => {
  const rule = {...defaultRecurrence('2026-10-05','daily'),endType:'count',count:2};
  const event = master('2026-10-05',rule,{allDay:true});
  const rows = expandEvents([event],...range('2026-10-05','2026-10-08'),zone);
  assert.deepEqual(dates(rows),['2026-10-05','2026-10-06']);
  const day = new Date(2026,9,5);
  assert.deepEqual(sharedAvailability([day],rows,[])[0].slots,[]);
  assert.equal(eventForm(event).endDate,'2026-10-05');
});
test('all-day dates remain the same when the viewer is in a different timezone', () => {
  const event = master('2026-10-05',null,{allDay:true});
  const ny = 'America/New_York';
  const rows = expandEvents([event],...range('2026-10-05','2026-10-07',ny),ny);
  assert.equal(DateTime.fromISO(rows[0].start,{zone:ny}).toISODate(),'2026-10-05');
});
test('overnight occurrences entering a week are included and elapsed duration is retained', () => {
  const event = master('2026-10-04',presetRecurrence('daily','2026-10-04'),{start:'23:00',end:'01:00',endDate:'2026-10-05'});
  const rows = expandEvents([event],...range('2026-10-05','2026-10-06'),zone);
  assert.equal(rows.length,2);
  assert.equal(DateTime.fromISO(rows[0].start,{zone}).toISODate(),'2026-10-04');
  assert.ok(rows.every(row=>Date.parse(row.end)-Date.parse(row.start)===2*3600000));
});
test('invalid weekly choices, end dates and empty rules cannot be saved', () => {
  assert.equal(validRecurrence({...defaultRecurrence('2026-10-03'),weekdays:[]},'2026-10-03'),false);
  assert.equal(validRecurrence({...defaultRecurrence('2026-10-03'),endType:'until',untilDate:'2026-10-02'},'2026-10-03'),false);
  assert.throws(()=>master('2026-10-03',{...presetRecurrence('weekdays','2026-10-03'),endType:'until',untilDate:'2026-10-03'}));
});
test('Sunday can be displayed without changing the default six-day calendar', () => {
  const day = new Date(2026,9,5);
  assert.equal(weekDays(day).length,6); const days=weekDays(day,true); assert.equal(days.length,7);
  assert.deepEqual(clipToWeek('2026-10-11','2026-10-11',days),{startIndex:6,endIndex:6});
});
test('never-ending series expand a future viewed week rather than generating an infinite list', () => {
  const event = master('2026-10-03',presetRecurrence('daily','2026-10-03'));
  assert.equal(expandEvents([event],...range('2027-10-04','2027-10-11'),zone).length,7);
});
