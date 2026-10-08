// Send only the signed-in owner's agenda fields to Android, never notes or peer calendars.
const fields = ['id','title','start','end','allDay','startTime','endTime','timeZone','progress','color','recurrence'];
const pick = row => Object.fromEntries(fields.filter(key => row[key] !== undefined).map(key => [key,row[key]]));
export function mobileRecords(events, tasks) {
  return {events:events.filter(row => !row.source).map(pick),tasks:tasks.filter(row => !row.source).map(row => ({...pick(row),steps:(row.steps || []).map(pick)}))};
}
export function reminderCatalog(events,tasks) {
  return [...events.filter(row => !row.source).map(row => ({key:`events:${row.id}`,title:row.title,kind:'Lịch'})),...tasks.filter(row => !row.source).flatMap(row => [{key:`tasks:${row.id}`,title:row.title,kind:'Công việc',completed:row.progress>=100},...(row.steps || []).map((step,index) => ({key:`steps:${row.id}/${step.id}`,title:`${row.title} · ${index+1}. ${step.title}`,kind:'Bước',completed:step.progress>=100 || row.progress>=100}))])];
}
