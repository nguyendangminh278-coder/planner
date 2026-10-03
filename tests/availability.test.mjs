import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clockMinutes, sharedAvailability } from '../src/lib/availability.js';

const day = new Date(2026, 9, 5);
const event = (hour, minute, endHour, endMinute, offset=0) => ({ start: new Date(2026,9,5+offset,hour,minute).toISOString(), end: new Date(2026,9,5+offset,endHour,endMinute).toISOString() });
const labels = rows => rows[0].slots.map(slot => [new Date(slot.start).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}), new Date(slot.end).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})]);

test('empty calendars yield one common interval within the selected hours', () => {
  assert.deepEqual(labels(sharedAvailability([day],[],[])), [['08:00','18:00']]);
});
test('busy intervals of either person are removed, including overlaps and adjacent events', () => {
  const mine = [event(9,0,10,0),event(14,0,15,0)];
  const theirs = [event(9,30,11,0),event(11,0,12,0),event(15,0,16,0)];
  assert.deepEqual(labels(sharedAvailability([day],mine,theirs)), [['08:00','09:00'],['12:00','14:00'],['16:00','18:00']]);
  assert.equal(mine.length, 2);
});
test('overnight events are clipped to each day and meetings outside the window do not block time', () => {
  const overnight = { start: new Date(2026,9,4,23,0).toISOString(), end: new Date(2026,9,5,9,0).toISOString() };
  assert.deepEqual(labels(sharedAvailability([day],[overnight,event(19,0,20,0)],[])), [['09:00','18:00']]);
});
test('minimum duration filters short gaps without rounding them into available time', () => {
  const rows = sharedAvailability([day],[event(8,0,9,0),event(9,20,10,0),event(10,30,18,0)],[],{minimum:30});
  assert.deepEqual(labels(rows), [['10:00','10:30']]);
  assert.equal(rows[0].slots[0].minutes, 30);
});
test('a fully busy window and touching boundaries do not create false availability', () => {
  assert.deepEqual(sharedAvailability([day],[event(7,0,19,0)],[])[0].slots, []);
  assert.deepEqual(labels(sharedAvailability([day],[event(7,0,8,0),event(18,0,19,0)],[])), [['08:00','18:00']]);
});
test('invalid ranges and malformed event timestamps fail rather than claiming calendars are free', () => {
  assert.equal(clockMinutes('24:00'), 1440); assert.equal(clockMinutes('25:00'), null);
  assert.throws(() => sharedAvailability([day],[],[],{from:'18:00',to:'08:00'}));
  assert.throws(() => sharedAvailability([day],[{start:'bad',end:'bad'}],[]));
});

test('second-precision boundaries are rounded inward so displayed minutes remain entirely free', () => {
  const busy = { start: new Date(2026,9,5,9,0,30).toISOString(), end: new Date(2026,9,5,10,0,30).toISOString() };
  assert.deepEqual(labels(sharedAvailability([day],[busy],[])), [['08:00','09:00'],['10:01','18:00']]);
});
