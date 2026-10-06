import { useState } from 'react';
import { Sun, CalendarDays, CheckCircle2, Clock3, Plus, ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react';
import { dateKey } from '../lib/date';
import { taskRangeLabel } from '../lib/taskSchedule';
import { isTaskComplete, taskTabs } from '../lib/taskActions';
import { CompletionButton, DeleteTaskButton, TaskDeleteDialog } from './TaskActions';
import { firebaseError } from '../lib/firebase';

export function TaskList({ tasks, onSelect, onAdd, onToggle, onStepToggle, onDelete, ownerName='' }) {
  const [tab, setTab] = useState('today');
  const [busy, setBusy] = useState(null), [error, setError] = useState('');
  const [deleteTask,setDeleteTask] = useState(null);
  const [expanded,setExpanded] = useState({});
  const today = dateKey(new Date());
  const rows = taskTabs(tasks, today);
  const tabs = [
    { id: 'today', title: 'Hôm nay', icon: Sun, rows: rows.today },
    { id: 'upcoming', title: 'Sắp tới', icon: CalendarDays, rows: rows.upcoming },
    { id: 'completed', title: 'Đã hoàn thành', icon: CheckCircle2, rows: rows.completed },
  ];
  async function act(task, action) {
    if (busy) return;
    setBusy(task.id); setError('');
    try { await action(task); return true; } catch (err) { setError(firebaseError(err)); return false; } finally { setBusy(null); }
  }
  function remove(task) { setError(''); setDeleteTask(task); }
  const visible = tabs.find(item => item.id === tab).rows.toSorted((a, b) => a.start.localeCompare(b.start));
  return <section className="task-overview"><div className="section-head"><div><span className="eyebrow">YOUR NEXT STEPS</span><h2>Việc cần làm</h2></div>{onAdd && <button className="text-btn" onClick={onAdd}><Plus size={16}/>Thêm việc</button>}</div><div className="task-tabs" role="tablist" aria-label="Lọc công việc">{tabs.map(item => <button type="button" key={item.id} role="tab" id={`task-tab-${item.id}`} aria-controls="task-tab-content" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={16}/>{item.title}<span>{item.rows.length}</span></button>)}</div><div id="task-tab-content" role="tabpanel" aria-labelledby={`task-tab-${tab}`}>
    {error && <p className="error-message" role="alert">{error}</p>}
    {visible.map(task => <article className="overview-task-group" key={task.id} aria-label={`Công việc: ${task.title}`} aria-busy={busy === task.id}><div className={`overview-task task-action-row ${isTaskComplete(task) ? 'is-completed' : ''}`}><CompletionButton title={task.title} completed={isTaskComplete(task)} busy={!!busy} onToggle={onToggle ? () => act(task,onToggle) : null}/><button type="button" className="task-open" aria-label={`Xem công việc: ${task.title}`} onClick={() => onSelect(task)}><span><b className="task-title">{task.title}</b><small><CalendarDays size={12}/>{taskRangeLabel(task)}{task.end < today && !isTaskComplete(task) ? <em>Quá hạn</em> : null}</small></span><strong>{task.progress || 0}%</strong><ArrowUpRight size={15}/></button><DeleteTaskButton title={task.title} busy={!!busy} onDelete={onDelete ? () => remove(task) : null}/></div>
      {!!task.steps?.length && <><button type="button" className="overview-steps-toggle" aria-expanded={expanded[task.id] ?? true} aria-label={`Các bước: ${task.title}`} onClick={() => setExpanded(old => ({...old,[task.id]:!(old[task.id] ?? true)}))}>{(expanded[task.id] ?? true) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}<span>{task.steps.filter(isTaskComplete).length}/{task.steps.length} bước hoàn thành</span></button>{(expanded[task.id] ?? true) && <ol className="overview-steps">{task.steps.map((step,index) => <li key={step.id} className={`overview-step task-action-row ${isTaskComplete(step) ? 'is-completed' : ''}`}><CompletionButton title={`Bước ${index+1}: ${step.title} · ${task.title}`} completed={isTaskComplete(step)} busy={!!busy} onToggle={onStepToggle ? () => act(task,current => onStepToggle(current,step.id)) : null}/><button type="button" className="task-open" aria-label={`Xem bước ${index+1}: ${step.title} · ${task.title}`} onClick={() => onSelect(task)}><span><b className="task-title">{index+1}. {step.title}</b><small>{taskRangeLabel({...step,timeZone:task.timeZone})}</small></span><strong>{step.progress || 0}%</strong></button></li>)}</ol>}</>}
    </article>)}
    {!visible.length && <p className="empty-state">{tab === 'today' ? ownerName ? 'Người này chưa có việc cần làm hôm nay. Chọn Sắp tới để xem các việc khác.' : 'Chưa có việc cần làm hôm nay. Bạn có thể xem Sắp tới hoặc thêm việc mới.' : tab === 'upcoming' ? 'Chưa có công việc sắp tới.' : 'Chưa có công việc đã hoàn thành.'}</p>}
  </div>{deleteTask && <TaskDeleteDialog title={deleteTask.title} busy={!!busy} error={error} onCancel={() => setDeleteTask(null)} onConfirm={async () => { if (await act(deleteTask,onDelete)) setDeleteTask(null); }}/>}</section>;
}

export function PlanningSummary({ tasks, events, onSelect, onShare, onClass, classOpen, ownerName='', calendarRange }) {
  const today = dateKey(new Date());
  const pending = tasks.filter(task => task.progress < 100);
  const next = pending.toSorted((a, b) => a.end.localeCompare(b.end)).slice(0, 4);
  const todayEvents = events.filter(event => calendarRange ? Date.parse(event.start) < calendarRange.end.getTime() && Date.parse(event.end) > calendarRange.start.getTime() : dateKey(new Date(event.start)) === today).length;
  return <aside className="planning-side"><section className="planning-summary"><span className="eyebrow">PLANNING AT A GLANCE</span><h3>Nhịp làm việc của {ownerName || 'bạn'}</h3><div className="summary-counts"><span><b>{pending.length}</b>Việc đang chạy</span><span><b>{todayEvents}</b>{calendarRange ? 'Lịch trong tuần' : 'Lịch hôm nay'}</span><span><b>{tasks.filter(task => task.progress >= 100).length}</b>Hoàn thành</span></div></section>
    <section className="next-deadlines"><h3><Clock3 size={17}/>Mốc cần chú ý</h3>{next.map(task => <button type="button" key={task.id} onClick={() => onSelect(task)}><span className="deadline-dot" style={{ background: task.color || '#ffe4e6' }}/><span><b>{task.title}</b><small>{task.end.split('-').reverse().join('/')}</small></span><ArrowUpRight size={14}/></button>)}{!next.length && <p className="empty-state">Chưa có mốc công việc.</p>}</section>
    {(onShare || onClass) && <section className="connected-calendars"><h3>Lịch kết nối</h3>{onShare && <button className="text-btn" onClick={onShare}>Chia sẻ lịch & công việc<ArrowUpRight size={15}/></button>}{onClass && <button className="text-btn" aria-expanded={classOpen} onClick={onClass}>Lịch & công việc lớp<ArrowUpRight size={15}/></button>}</section>}
  </aside>;
}
