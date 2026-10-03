import { dateKey } from './date.js';

export function clockMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value || '');
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour <= 24 && minute < 60 && (hour < 24 || minute === 0) ? hour * 60 + minute : null;
}

export function sharedAvailability(days, mine, theirs, { from = '08:00', to = '18:00', minimum = 30 } = {}) {
  const startMinute = clockMinutes(from), endMinute = clockMinutes(to);
  if (startMinute === null || endMinute === null || endMinute <= startMinute || !Number.isFinite(minimum) || minimum < 1) throw new Error('Chọn giờ kết thúc sau giờ bắt đầu và độ dài khoảng trống hợp lệ.');
  const busy = [...mine, ...theirs].map(event => {
    const start = Date.parse(event.start), end = Date.parse(event.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('Một lịch có thời gian không hợp lệ, nên chưa thể xác định khoảng trống chung.');
    return [start, end];
  });
  return days.map(day => {
    const begin = new Date(day), finish = new Date(day);
    begin.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
    finish.setHours(Math.floor(endMinute / 60), endMinute % 60, 0, 0);
    const low = begin.getTime(), high = finish.getTime();
    const intervals = busy.filter(([start, end]) => start < high && end > low).map(([start, end]) => [Math.max(start, low), Math.min(end, high)]).sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const interval of intervals) {
      const last = merged[merged.length - 1];
      if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
      else merged.push([...interval]);
    }
    const slots = [];
    const push = (start, end) => {
      // The UI schedules whole minutes: never label a partially busy minute as free.
      start = Math.ceil(start / 60000) * 60000;
      end = Math.floor(end / 60000) * 60000;
      if (end - start >= minimum * 60000) slots.push({ start: new Date(start).toISOString(), end: new Date(end).toISOString(), minutes: (end - start) / 60000 });
    };
    let cursor = low;
    for (const [start, end] of merged) { push(cursor, start); cursor = end; }
    push(cursor, high);
    return { date: dateKey(day), slots };
  });
}
