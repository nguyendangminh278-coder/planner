import { DateTime, IANAZone } from 'luxon';

export const taskTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';
const validClock = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;
export const scheduleDefaults = (item, zone=taskTimeZone()) => ({...item,allDay:item.allDay !== false,startTime:item.startTime || '09:00',endTime:item.endTime || '10:00',timeZone:item.timeZone || zone});

export function taskForm(item, today) {
  const form = scheduleDefaults({title:'',start:today,end:today,progress:0,details:'',color:'#ffe4e6',steps:[],...item});
  return {...form,steps:form.steps.map(step => scheduleDefaults(step,form.timeZone))};
}

export function scheduleInterval(item, fallbackZone=taskTimeZone()) {
  const zone = item.timeZone || fallbackZone;
  if (!validDate(item.start) || !validDate(item.end) || item.end < item.start || !IANAZone.isValidZone(zone)) throw new Error('Chọn ngày bắt đầu, ngày kết thúc và múi giờ hợp lệ.');
  const allDay = item.allDay !== false;
  if (!allDay && (!validClock(item.startTime) || !validClock(item.endTime))) throw new Error('Điền giờ bắt đầu và kết thúc theo định dạng 00:00–23:59.');
  const start = DateTime.fromISO(`${item.start}T${allDay ? '00:00' : item.startTime}`,{zone});
  let end = DateTime.fromISO(`${item.end}T${allDay ? '00:00' : item.endTime}`,{zone});
  if (allDay) end = end.plus({days:1});
  if (!start.isValid || !end.isValid || end <= start) throw new Error('Mốc kết thúc phải sau mốc bắt đầu. Nếu qua đêm, chọn ngày kết thúc là ngày hôm sau.');
  if (!allDay && (start.toFormat('HH:mm') !== item.startTime || end.toFormat('HH:mm') !== item.endTime)) throw new Error('Giờ đã chọn không tồn tại trong múi giờ này. Hãy chọn giờ khác.');
  return {start:start.toMillis(),end:end.toMillis()};
}

export function taskScheduleData(form) {
  if (!form.title.trim()) throw new Error('Điền tên công việc.');
  const parent = scheduleInterval(form);
  const fields = item => ({allDay:item.allDay !== false,startTime:item.allDay !== false ? null : item.startTime,endTime:item.allDay !== false ? null : item.endTime,timeZone:form.timeZone});
  const steps = form.steps.map(step => {
    if (!step.title.trim()) throw new Error('Điền tên cho tất cả các bước.');
    const range = scheduleInterval({...step,timeZone:form.timeZone});
    if (range.start < parent.start || range.end > parent.end) throw new Error(`Mốc thời gian của bước “${step.title}” phải nằm trong thời gian công việc. Bước cả ngày cần nằm trọn ngày trong công việc.`);
    return {...step,...fields(step),title:step.title.trim(),progress:Number(step.progress)};
  });
  return {title:form.title.trim(),start:form.start,end:form.end,...fields(form),progress:Number(form.progress),previousProgress:form.previousProgress ?? null,details:form.details,color:form.color,steps};
}

export function taskTimeLabel(item, fallbackZone=taskTimeZone()) {
  if (item.allDay !== false) return 'Cả ngày';
  const zone = item.timeZone || fallbackZone;
  return `${item.startTime}–${item.endTime}${zone !== taskTimeZone() ? ` · ${zone}` : ''}`;
}

export function taskRangeLabel(item) {
  const date = value => typeof value === 'string' ? value.split('-').reverse().join('/') : '';
  if (item.start === item.end) return `${date(item.start)} · ${taskTimeLabel(item)}`;
  if (item.allDay !== false) return `${date(item.start)} → ${date(item.end)} · Cả ngày`;
  const zone = item.timeZone || taskTimeZone();
  return `${date(item.start)} ${item.startTime} → ${date(item.end)} ${item.endTime}${zone !== taskTimeZone() ? ` · ${zone}` : ''}`;
}
