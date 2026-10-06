import {useEffect,useMemo,useRef,useState} from 'react';
import {Clock3} from 'lucide-react';
import {dateKey,fmtFull} from '../lib/date';
import {dayStyle} from '../lib/theme';
import {taskGridEntries,taskDayLayout} from '../lib/taskGrid';
import {taskRangeLabel} from '../lib/taskSchedule';
import {isTaskComplete} from '../lib/taskActions';
import {firebaseError} from '../lib/firebase';
import {CompletionButton} from './TaskActions';

const hours=Array.from({length:24},(_,index)=>index);
export default function TaskTimeGrid({days,tasks,onSelect,onToggle,onStepToggle,label='Lưới giờ công việc'}) {
  const [mode,setMode]=useState('tasks'),[busy,setBusy]=useState(null),[error,setError]=useState('');
  const ref=useRef(null);
  const data=useMemo(()=>taskGridEntries(tasks,mode),[tasks,mode]);
  const layouts=useMemo(()=>days.map(day=>taskDayLayout(data.entries,day)),[data,days]);
  const allDay=data.entries.filter(entry=>entry.allDay && entry.item.start<=dateKey(days[days.length-1]) && entry.item.end>=dateKey(days[0]));
  const width=Math.max(130,Math.min(5,Math.max(1,...layouts.flat().map(row=>row.lanes)))*80);
  useEffect(()=>{ref.current.scrollTop=8*70.8;},[]);
  async function toggle(entry) {
    if (busy) return;
    setBusy(entry.id); setError('');
    try { await (entry.stepId ? onStepToggle(entry.task,entry.stepId) : onToggle(entry.task)); }
    catch (err) { setError(firebaseError(err)); } finally {setBusy(null);}
  }
  function card(entry,style,compact=false) {
    const done=isTaskComplete(entry.item);
    const name=entry.stepId ? `Bước ${entry.index+1}: ${entry.item.title} · ${entry.task.title}` : entry.item.title;
    const canToggle=entry.stepId ? !!onStepToggle : !!onToggle;
    return <div key={entry.id} className={`task-grid-card ${compact?'compact':'event'} ${done?'is-completed':''}`} style={{background:entry.item.color || entry.task.color || '#cffafe',...style}} title={`${name} · ${taskRangeLabel(entry.item)}`}><CompletionButton title={name} completed={done} busy={!!busy} onToggle={canToggle?()=>toggle(entry):null}/><button type="button" className="task-grid-detail" aria-label={`Xem trong lưới: ${name}`} onClick={()=>onSelect(entry.task)}><b className="task-title">{entry.item.title}</b>{!compact && <><span><Clock3 size={11}/>{`${entry.fromLabel}–${entry.toLabel}`}</span><small>{entry.stepId ? entry.task.title : 'Công việc'} · {entry.item.progress || 0}%</small></>}</button></div>;
  }
  return <div className="task-time-grid"><div className="task-grid-controls"><label>Hiển thị trong lưới<select aria-label={`${label}: Hiển thị`} value={mode} onChange={event=>setMode(event.target.value)}><option value="tasks">Công việc</option><option value="steps">Các bước</option><option value="both">Công việc & các bước</option></select></label><span>Cả ngày ở hàng trên · Cuộn để xem các giờ khác</span></div>{(error || data.errors.length>0) && <p className="error-message" role="alert">{error || `${data.errors.length} mục có thời gian chưa hợp lệ. Mở chi tiết để cập nhật.`}</p>}<div className="calendar-grid-wrap task-grid-wrap" ref={ref} role="region" aria-label={label} tabIndex={0}><div className="calendar-grid" style={{'--week-count':days.length,gridTemplateColumns:`64px repeat(${days.length},minmax(${width}px,1fr))`,minWidth:64+days.length*width}}><div className="time-head"/>{days.map((day,index)=><div className="day-head" key={dateKey(day)} style={dayStyle(index)}><strong>{fmtFull(day).split(',')[0]}</strong><span>{day.getDate()}/{day.getMonth()+1}</span></div>)}{!!allDay.length && <><div className="all-day-label">Cả ngày</div>{days.map((day,index)=>{const key=dateKey(day);return <div className="all-day-cell task-all-day-cell" key={`all-${key}`} style={dayStyle(index)} role="region" aria-label={`Công việc cả ngày ${key}`} tabIndex={0}>{allDay.filter(entry=>entry.item.start<=key && entry.item.end>=key).map(entry=>card(entry,{},true))}</div>;})}</>}<div className="time-col">{hours.map(hour=><div className="time-label" key={hour}>{String(hour).padStart(2,'0')}:00</div>)}</div>{days.map((day,index)=><div className="day-col" style={dayStyle(index)} key={dateKey(day)}>{hours.map(hour=><div className="hour-line" key={hour}/>)}{layouts[index].map(entry=>card(entry,{top:entry.startMinute*1.18,height:Math.max(30,(entry.endMinute-entry.startMinute)*1.18),left:`calc(${entry.lane/entry.lanes*100}% + 3px)`,width:`calc(${100/entry.lanes}% - 6px)`,right:'auto'}))}</div>)}</div></div>{!data.entries.length && !data.errors.length && <p className="empty-state">Chưa có {mode==='steps'?'bước':'công việc'} để hiển thị trong lưới.</p>}</div>;
}
