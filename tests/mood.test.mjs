import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validMoodEntry, moodCalendarCells, monthlyMoodStats } from '../src/lib/mood.js';

test('mood validation rejects unknown states, invalid days and overly long notes', () => {
  assert.equal(validMoodEntry('2026-10-03', 'rainbow', 'Feeling good'), true);
  assert.equal(validMoodEntry('2026-02-30', 'cloudy', ''), false);
  assert.equal(validMoodEntry('2026-10-03', 'unknown', ''), false);
  assert.equal(validMoodEntry('2026-10-03', 'cloudy', 'x'.repeat(4001)), false);
  assert.equal(validMoodEntry('2026-10-03', 'cloudy', null), false);
});
test('mood month starts on Monday and handles leap years and year transitions', () => {
  const october = moodCalendarCells(new Date(2026, 9, 1));
  assert.deepEqual(october.slice(0, 4), [null, null, null, '2026-10-01']);
  assert.equal(october.filter(Boolean).length, 31); assert.equal(october.length % 7, 0);
  assert.equal(moodCalendarCells(new Date(2024, 1, 1)).filter(Boolean).length, 29);
  const january = moodCalendarCells(new Date(2027, 0, 1));
  assert.ok(january.includes('2027-01-31')); assert.ok(!january.includes('2026-12-31'));
});
test('statistics count only valid logged days in the selected month', () => {
  const entries = {
    '2026-10-01': { moodId: 'sunny', note: '' },
    '2026-10-03': { moodId: 'rainbow', note: 'Creative' },
    '2026-09-30': { moodId: 'sunny', note: '' },
    '2026-10-99': { moodId: 'sunny', note: '' },
    '2026-10-04': { moodId: 'bad', note: '' },
  };
  const stats = monthlyMoodStats(entries, new Date(2026, 9, 1));
  assert.equal(stats.reduce((sum, item) => sum + item.count, 0), 2);
  assert.equal(stats.find(item => item.id === 'sunny').count, 1);
  assert.equal(stats.find(item => item.id === 'rainbow').count, 1);
});
