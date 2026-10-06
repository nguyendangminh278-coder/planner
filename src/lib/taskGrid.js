import {DateTime} from 'luxon';
import {scheduleInterval,taskTimeZone} from './taskSchedule.js';

export function taskGridEntries(tasks,mode='tasks',viewerZone=taskTimeZone()) {
  const entries=[], errors=[];
  for (const task of tasks) {
    const rows = [...(mode !== 'steps' ? [{item:task,stepId:null,index:null}] : []),...(mode !== 'tasks' ? (task.steps || []).map((item,index) => ({item,stepId:item.id,index})) : [])];
    for (const row of rows) {
      try {
        const item = {...row.item,timeZone:task.timeZone || row.item.timeZone};
        let range = scheduleInterval(item);
        const allDay = item.allDay !== false;
        if (allDay) range = {start:DateTime.fromISO(item.start,{zone:viewerZone}).startOf('day').toMillis(),end:DateTime.fromISO(item.end,{zone:viewerZone}).plus({days:1}).startOf('day').toMillis()};
        entries.push({...row,task,item,id:`${task.id}:${row.stepId ? `step:${row.stepId}` : 'task'}`,allDay,...range});
      } catch { errors.push(row.item.title || task.title); }
    }
  }
  return {entries,errors};
}

export function taskDayLayout(entries,day,zone=taskTimeZone()) {
  const low = DateTime.fromJSDate(day,{zone}).startOf('day'), high = low.plus({days:1});
  const rows = entries.filter(row => !row.allDay && row.start < high.toMillis() && row.end > low.toMillis()).map(row => {
    const start=Math.max(row.start,low.toMillis()),end=Math.min(row.end,high.toMillis());
    const from=DateTime.fromMillis(start,{zone}),to=DateTime.fromMillis(end,{zone});
    const startMinute=from.hour*60+from.minute+from.second/60;
    const endMinute=end===high.toMillis() ? 1440 : to.hour*60+to.minute+to.second/60;
    return {...row,start,end,startMinute,endMinute:Math.min(1440,endMinute>startMinute ? endMinute : startMinute+(end-start)/60000),fromLabel:from.toFormat('HH:mm'),toLabel:end===high.toMillis() ? '24:00' : to.toFormat('HH:mm')};
  }).sort((a,b) => a.start-b.start || b.end-a.end || a.id.localeCompare(b.id));
  const output=[]; let cluster=[],lanes=[],end=0;
  const flush=() => { output.push(...cluster.map(row => ({...row,lanes:lanes.length}))); cluster=[]; lanes=[]; end=0; };
  for (const row of rows) {
    if (cluster.length && row.start>=end) flush();
    let lane=lanes.findIndex(until => until<=row.start);
    if (lane<0) lane=lanes.length;
    lanes[lane]=row.end; cluster.push({...row,lane}); end=Math.max(end,row.end);
  }
  flush(); return output;
}
