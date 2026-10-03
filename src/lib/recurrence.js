import * as rruleModule from 'rrule/dist/es5/rrule.js';
import { DateTime, IANAZone } from 'luxon';

const RRule = rruleModule.RRule || rruleModule.default?.RRule;
const frequencies = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY, yearly: RRule.YEARLY };
const weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];
export const weekdayNames = ['thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy', 'Chủ nhật'];
export const weekdayChips = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const eventTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
const cache = new WeakMap();
const wallDate = date => { const value = new Date(0); value.setUTCFullYear(date.year, date.month-1, date.day); value.setUTCHours(date.hour,date.minute,date.second,date.millisecond); return value; };
const calendarDays = (start, end) => DateTime.fromISO(end.toISODate(), { zone: 'UTC' }).diff(DateTime.fromISO(start.toISODate(), { zone: 'UTC' }), 'days').days;

export function defaultRecurrence(date, frequency='weekly') {
  return { frequency, interval: 1, weekdays: frequency === 'weekly' ? [DateTime.fromISO(date).weekday] : [], monthlyMode: 'date', endType: 'never', untilDate: null, count: null };
}

export function presetRecurrence(preset, date) {
  if (preset === 'none') return null;
  if (preset === 'weekdays') return { ...defaultRecurrence(date), weekdays: [1,2,3,4,5] };
  const rule = defaultRecurrence(date, preset === 'monthly-weekday' ? 'monthly' : preset);
  return preset === 'monthly-weekday' ? { ...rule, monthlyMode: 'weekday' } : rule;
}

export function validRecurrence(rule, date) {
  if (rule === null) return true;
  if (!rule || !Object.hasOwn(frequencies, rule.frequency) || !Number.isInteger(rule.interval) || rule.interval < 1 || rule.interval > 99) return false;
  if (!Array.isArray(rule.weekdays) || rule.weekdays.length > 7 || new Set(rule.weekdays).size !== rule.weekdays.length || rule.weekdays.some(day => !Number.isInteger(day) || day < 1 || day > 7) || (rule.frequency === 'weekly' && !rule.weekdays.length)) return false;
  if (!['date','weekday'].includes(rule.monthlyMode) || !['never','until','count'].includes(rule.endType)) return false;
  if (rule.endType === 'count') return Number.isInteger(rule.count) && rule.count >= 1 && rule.count <= 1000 && rule.untilDate === null;
  if (rule.endType === 'until') {
    const until = typeof rule.untilDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rule.untilDate) ? DateTime.fromISO(rule.untilDate) : null;
    return !!until?.isValid && until.toISODate() === rule.untilDate && (!date || rule.untilDate >= date) && rule.count === null;
  }
  return rule.untilDate === null && rule.count === null;
}

function prepare(event) {
  if (cache.has(event)) return cache.get(event);
  const zone = event.timeZone || eventTimeZone();
  const start = DateTime.fromISO(event.start, { zone }), end = DateTime.fromISO(event.end, { zone });
  if (!IANAZone.isValidZone(zone) || !start.isValid || !end.isValid || end <= start || !validRecurrence(event.recurrence, start.toISODate())) throw new Error('Lịch có thời gian, múi giờ hoặc cấu hình lặp không hợp lệ.');
  const options = { freq: frequencies[event.recurrence.frequency], interval: event.recurrence.interval, dtstart: wallDate(start), wkst: RRule.MO };
  if (event.recurrence.frequency === 'weekly') options.byweekday = event.recurrence.weekdays.map(day => weekdays[day-1]);
  if (event.recurrence.frequency === 'monthly') {
    if (event.recurrence.monthlyMode === 'weekday') options.byweekday = weekdays[start.weekday-1].nth(Math.ceil(start.day / 7));
    else options.bymonthday = start.day;
  }
  if (event.recurrence.endType === 'count') options.count = event.recurrence.count;
  if (event.recurrence.endType === 'until') options.until = wallDate(DateTime.fromISO(event.recurrence.untilDate, { zone }).endOf('day'));
  const rule = new RRule(options);
  const first = rule.after(wallDate(start), true);
  if (!first) throw new Error('Chuỗi không có lần xuất hiện nào trước ngày kết thúc. Hãy đổi ngày hoặc quy tắc lặp.');
  const result = { rule, start, end, zone, duration: end.toMillis() - start.toMillis(), days: Math.max(1, calendarDays(start, end)) };
  cache.set(event, result);
  return result;
}

export function buildEventData(form, recurrence) {
  if (!form.title.trim() || !IANAZone.isValidZone(form.timeZone)) throw new Error('Điền tên lịch và chọn múi giờ hợp lệ.');
  const start = DateTime.fromISO(`${form.date}T${form.allDay ? '00:00' : form.start}`, { zone: form.timeZone });
  let end = DateTime.fromISO(`${form.endDate}T${form.allDay ? '00:00' : form.end}`, { zone: form.timeZone });
  if (form.allDay) end = end.plus({ days: 1 });
  if (!start.isValid || !end.isValid || end <= start) throw new Error('Chọn ngày, giờ kết thúc sau thời gian bắt đầu.');
  if (!validRecurrence(recurrence, form.date)) throw new Error('Quy tắc lặp chưa hợp lệ. Chọn thứ, khoảng lặp và thời điểm kết thúc.');
  const data = { title: form.title.trim(), start: start.toUTC().toISO(), end: end.toUTC().toISO(), color: form.color, allDay: form.allDay, timeZone: form.timeZone, recurrence };
  if (recurrence) prepare(data);
  return data;
}

export function eventForm(event, initialDate) {
  const zone = event?.timeZone || eventTimeZone();
  if (!event) return { title: '', date: initialDate, endDate: initialDate, start: '09:00', end: '10:00', color: '#cffafe', allDay: false, timeZone: zone };
  const start = DateTime.fromISO(event.start, { zone }), end = DateTime.fromISO(event.end, { zone });
  return { title: event.title, date: start.toISODate(), endDate: (event.allDay ? end.minus({ days: 1 }) : end).toISODate(), start: start.toFormat('HH:mm'), end: end.toFormat('HH:mm'), color: event.color || '#cffafe', allDay: !!event.allDay, timeZone: zone };
}

export function recurrenceSummary(rule, date) {
  if (!rule) return 'Không lặp lại';
  const anchor = DateTime.fromISO(date);
  if (!anchor.isValid || !validRecurrence(rule, date)) return 'Lặp lại tùy chỉnh';
  const unit = { daily: 'ngày', weekly: 'tuần', monthly: 'tháng', yearly: 'năm' }[rule.frequency];
  let label = `Mỗi ${rule.interval === 1 ? '' : `${rule.interval} `}${unit}`;
  if (rule.frequency === 'weekly') label += ` vào ${rule.weekdays.map(day => weekdayChips[day-1]).join(', ')}`;
  if (rule.frequency === 'monthly') label += rule.monthlyMode === 'weekday' ? ` vào ${monthlyWeekdayLabel(date)}` : ` vào ngày ${anchor.day}`;
  if (rule.frequency === 'yearly') label += ` vào ${anchor.day}/${anchor.month}`;
  if (rule.endType === 'until') label += `, đến ${rule.untilDate.split('-').reverse().join('/')}`;
  if (rule.endType === 'count') label += `, ${rule.count} lần`;
  return label;
}

export function monthlyWeekdayLabel(date) {
  const anchor = DateTime.fromISO(date);
  if (!anchor.isValid) return 'ngày đã chọn';
  return `${weekdayNames[anchor.weekday-1]} ${['đầu tiên','thứ hai','thứ ba','thứ tư','thứ năm'][Math.ceil(anchor.day/7)-1]}`;
}

export function occurrenceTimeLabel(event) {
  if (event.allDay) return 'Cả ngày';
  const time = value => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${time(event.start)}–${time(event.end)}`;
}

// Expand only occurrences intersecting the requested week. Never create duplicate Firestore docs.
export function expandEvents(events, rangeStart, rangeEnd, viewerZone=eventTimeZone()) {
  const low = rangeStart.getTime(), high = rangeEnd.getTime();
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low || !IANAZone.isValidZone(viewerZone)) throw new Error('Khoảng xem lịch không hợp lệ.');
  return events.flatMap(event => {
    if (!event.recurrence) {
      if (!event.allDay) return [{ ...event, seriesId: event.id, sourceEvent: event }];
      const zone = event.timeZone || viewerZone;
      const start = DateTime.fromISO(event.start, { zone }), end = DateTime.fromISO(event.end, { zone });
      if (!start.isValid || !end.isValid) throw new Error('Lịch cả ngày có ngày không hợp lệ.');
      const begin = DateTime.fromISO(start.toISODate(), { zone: viewerZone }).startOf('day');
      const finish = begin.plus({ days: Math.max(1, calendarDays(start, end)) });
      return [{ ...event, start: begin.toUTC().toISO(), end: finish.toUTC().toISO(), seriesId: event.id, sourceEvent: event }];
    }
    const prepared = prepare(event);
    const from = DateTime.fromJSDate(rangeStart).setZone(prepared.zone).minus({ days: Math.ceil(prepared.duration / 86400000) + 2 }).startOf('day');
    const to = DateTime.fromJSDate(rangeEnd).setZone(prepared.zone).plus({ days: 2 }).endOf('day');
    let tooMany = false;
    const dates = prepared.rule.between(wallDate(from), wallDate(to), true, (_date, index) => { if (index >= 512) { tooMany = true; return false; } return true; });
    if (tooMany) throw new Error('Chuỗi lặp tạo quá nhiều lịch trong khoảng xem. Hãy thu hẹp thời lượng mỗi lịch.');
    return dates.map(wall => {
      const fields = { year: wall.getUTCFullYear(), month: wall.getUTCMonth()+1, day: wall.getUTCDate(), hour: wall.getUTCHours(), minute: wall.getUTCMinutes(), second: wall.getUTCSeconds(), millisecond: wall.getUTCMilliseconds() };
      let begin = DateTime.fromObject(fields, { zone: event.allDay ? viewerZone : prepared.zone });
      if (!event.allDay) {
        if (wall.getTime() === wallDate(prepared.start).getTime()) begin = prepared.start;
        else begin = begin.getPossibleOffsets().sort((a,b) => a.toMillis()-b.toMillis())[0];
      }
      const finish = event.allDay ? begin.startOf('day').plus({ days: prepared.days }) : begin.plus({ milliseconds: prepared.duration });
      return { ...event, id: `${event.id}@${wall.getTime()}`, seriesId: event.id, sourceEvent: event, start: begin.toUTC().toISO(), end: finish.toUTC().toISO() };
    }).filter(event => Date.parse(event.start) < high && Date.parse(event.end) > low);
  });
}
