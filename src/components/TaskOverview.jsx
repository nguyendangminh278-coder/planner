import { useState } from 'react';
import { Sun, CalendarDays, CheckCircle2, Clock3, Plus, ArrowUpRight } from 'lucide-react';
import { dateKey } from '../lib/date';

export function TaskList({ tasks, onSelect, onAdd, ownerName='' }) {
  const [tab, setTab] = useState('today');
  const today = dateKey(new Date());
  const tabs = [
    { id: 'today', title: 'Hôm nay', icon: Sun, rows: tasks.filter(task => task.progress < 100 && task.start <= today) },
    { id: 'upcoming', title: 'Sắp tới', icon: CalendarDays, rows: tasks.filter(task => task.progress < 100 && task.start > today) },
    { id: 'completed', title: 'Đã hoàn thành', icon: CheckCircle2, rows: tasks.filter(task => task.progress >= 100) },
  ];
  const visible = tabs.find(item => item.id === tab).rows.toSorted((a, b) => a.start.localeCompare(b.start));
  return <section className="task-overview"><div className="section-head"><div><span className="eyebrow">YOUR NEXT STEPS</span><h2>Việc cần làm</h2></div>{onAdd && <button className="text-btn" onClick={onAdd}><Plus size={16}/>Thêm việc</button>}</div><div className="task-tabs" role="tablist" aria-label="Lọc công việc">{tabs.map(item => <button type="button" key={item.id} role="tab" id={`task-tab-${item.id}`} aria-controls="task-tab-content" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><item.icon size={16}/>{item.title}<span>{item.rows.length}</span></button>)}</div><div id="task-tab-content" role="tabpanel" aria-labelledby={`task-tab-${tab}`}>
    {visible.map(task => <button type="button" className="overview-task" key={task.id} onClick={() => onSelect(task)}><i style={{ background: task.color || '#ffe4e6' }}>{task.progress >= 100 ? <CheckCircle2 size={17}/> : <span className="overview-circle"/>}</i><span><b>{task.title}</b><small><CalendarDays size={12}/>{task.start.split('-').reverse().join('/')} → {task.end.split('-').reverse().join('/')}{task.end < today && task.progress < 100 ? <em>Quá hạn</em> : null}</small></span><strong>{task.progress || 0}%</strong><ArrowUpRight size={15}/></button>)}
    {!visible.length && <p className="empty-state">{tab === 'today' ? ownerName ? 'Người này chưa có việc cần làm hôm nay. Chọn Sắp tới để xem các việc khác.' : 'Chưa có việc cần làm hôm nay. Bạn có thể xem Sắp tới hoặc thêm việc mới.' : tab === 'upcoming' ? 'Chưa có công việc sắp tới.' : 'Chưa có công việc đã hoàn thành.'}</p>}
  </div></section>;
}

export function PlanningSummary({ tasks, events, onSelect, onShare, onClass, classOpen, ownerName='' }) {
  const today = dateKey(new Date());
  const pending = tasks.filter(task => task.progress < 100);
  const next = pending.toSorted((a, b) => a.end.localeCompare(b.end)).slice(0, 4);
  const todayEvents = events.filter(event => dateKey(new Date(event.start)) === today).length;
  return <aside className="planning-side"><section className="planning-summary"><span className="eyebrow">PLANNING AT A GLANCE</span><h3>Nhịp làm việc của {ownerName || 'bạn'}</h3><div className="summary-counts"><span><b>{pending.length}</b>Việc đang chạy</span><span><b>{todayEvents}</b>Lịch hôm nay</span><span><b>{tasks.filter(task => task.progress >= 100).length}</b>Hoàn thành</span></div></section>
    <section className="next-deadlines"><h3><Clock3 size={17}/>Mốc cần chú ý</h3>{next.map(task => <button type="button" key={task.id} onClick={() => onSelect(task)}><span className="deadline-dot" style={{ background: task.color || '#ffe4e6' }}/><span><b>{task.title}</b><small>{task.end.split('-').reverse().join('/')}</small></span><ArrowUpRight size={14}/></button>)}{!next.length && <p className="empty-state">Chưa có mốc công việc.</p>}</section>
    {(onShare || onClass) && <section className="connected-calendars"><h3>Lịch kết nối</h3>{onShare && <button className="text-btn" onClick={onShare}>Chia sẻ lịch & công việc<ArrowUpRight size={15}/></button>}{onClass && <button className="text-btn" aria-expanded={classOpen} onClick={onClass}>Lịch & công việc lớp<ArrowUpRight size={15}/></button>}</section>}
  </aside>;
}
