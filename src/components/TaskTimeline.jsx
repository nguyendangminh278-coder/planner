import { ChevronDown, ChevronRight, Grid2X2, List } from 'lucide-react';
import { useState } from 'react';
import { clipToWeek, dateKey } from '../lib/date';
import { CompletionButton } from './TaskActions';
import { firebaseError } from '../lib/firebase';
import { taskTimeLabel, taskRangeLabel } from '../lib/taskSchedule';
import TaskTimeGrid from './TaskTimeGrid';
import BoundedTaskList from './BoundedTaskList';

function SpanBar({item, days, parent=false, onSelect}) {
  const span = clipToWeek(item.start, item.end, days);
  if (!span) return null;
  return <button onClick={()=>onSelect(item)} title={`${item.title} · ${taskRangeLabel(item)}`} className={`timeline-bar ${parent?'parent':''} ${item.progress >= 100 ? 'is-completed' : ''}`} style={{ gridColumn:`${span.startIndex+2} / ${span.endIndex+3}`, background:item.color }}>
    <span>{item.title}</span><small>{taskTimeLabel(item)} · {item.start.split('-').slice(1).reverse().join('/')} → {item.end.split('-').slice(1).reverse().join('/')}</small>
    <i style={{width:`${item.progress||0}%`}}></i>
  </button>
}

function TaskLinks({task, days}) {
  const parent = clipToWeek(task.start, task.end, days);
  if (!parent) return null;
  const steps = task.steps || [], height = 48 * (steps.length + 1);
  const stem = parent.startIndex * 100 + 12;
  const visible = steps.map((step, index) => ({ span: clipToWeek(step.start, step.end, days), index })).filter(step => step.span);
  return <svg className="task-links" viewBox={`0 0 ${days.length*100} ${height}`} preserveAspectRatio="none" style={{height}} aria-hidden="true">
    {visible.map(({span,index}) => <path key={`parent-${index}`} d={`M ${stem} 24 V ${72 + index*48} H ${span.startIndex*100+12}`} className="parent-connector"/>)}
    {steps.slice(1).map((step,index) => {
      const previous = clipToWeek(steps[index].start, steps[index].end, days), next = clipToWeek(step.start, step.end, days);
      return previous && next ? <path key={`next-${index}`} d={`M ${previous.endIndex*100+88} ${72+index*48} V ${96+index*48} H ${next.startIndex*100+12} V ${120+index*48}`} className="step-connector"/> : null;
    })}
  </svg>;
}

export default function TaskTimeline({days, tasks, onSelect, readOnly=false, onToggle, onStepToggle}) {
  const [open,setOpen]=useState({});
  const [view,setView]=useState('timeline');
  const [busy,setBusy]=useState(null), [error,setError]=useState('');
  async function act(task, action) {
    if (busy) return;
    setBusy(task.id); setError('');
    try { await action(); return true; } catch (err) { setError(firebaseError(err)); return false; } finally { setBusy(null); }
  }
  return <section className="timeline-section" style={{'--week-count':days.length}}>
    <div className="section-head"><div><span className="eyebrow">3-LEVEL TODO</span><h2>Việc đang chạy</h2></div><div className="calendar-view-switch" role="group" aria-label="Kiểu xem việc đang chạy"><button type="button" className={view==='timeline'?'active':''} aria-pressed={view==='timeline'} onClick={()=>setView('timeline')}><List size={15}/>Timeline</button><button type="button" className={view==='grid'?'active':''} aria-pressed={view==='grid'} onClick={()=>setView('grid')}><Grid2X2 size={15}/>Lưới giờ</button></div></div>
    {view==='grid' ? <TaskTimeGrid days={days} tasks={tasks} onSelect={onSelect} onToggle={onToggle} onStepToggle={onStepToggle} label="Lưới giờ việc đang chạy"/> : <><p className="task-scroll-note">Bậc 1 ở trên, các bước bậc 2 nối bên dưới. Hiện tối đa 5 việc; cuộn để xem tiếp.</p><div className="timeline-scroll-shell"><div className="timeline-scroll-content">
    <div className="timeline-head"><span>Công việc</span>{days.map(d=><span key={dateKey(d)}>{d.toLocaleDateString('vi-VN',{weekday:'short'})}<b>{d.getDate()}</b></span>)}</div>
    <BoundedTaskList className="timeline-body" label="Danh sách việc đang chạy" resetKey={null}>
      {error && <p className="error-message" role="alert">{error}</p>}
      {tasks.map(task => <div data-task-card data-mascot-task={task.id} className={`task-group ${task.progress >= 100 ? 'is-completed' : ''}`} key={task.id}>
        {(open[task.id] ?? true) && <TaskLinks task={task} days={days}/>}
        <div className="timeline-row parent-row">
          <div className="task-label"><button className="icon-btn" aria-label={`Ẩn/hiện bước: ${task.title}`} onClick={()=>setOpen(o=>({...o,[task.id]:!(o[task.id] ?? true)}))}>{(open[task.id] ?? true)?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</button><CompletionButton title={task.title} completed={task.progress >= 100} busy={!!busy} onToggle={onToggle ? () => act(task,() => onToggle(task)) : null}/><button className="text-btn" onClick={()=>onSelect(task)}><b>{task.title}</b><small className="timeline-schedule">{taskTimeLabel(task)}</small></button><span>{task.progress}%</span></div>
          <SpanBar item={task} days={days} parent onSelect={onSelect}/>
        </div>
        {(open[task.id] ?? true) && task.steps?.map((step,idx)=><div className="timeline-row child-row" key={step.id}>
          <div className={`task-label child ${step.progress >= 100 ? 'is-completed' : ''}`}><CompletionButton title={`Bước ${idx+1}: ${step.title} · ${task.title}`} completed={step.progress >= 100} busy={!!busy} onToggle={onStepToggle ? () => act(task,() => onStepToggle(task,step.id)) : null}/><button className="timeline-step-open" onClick={()=>onSelect(task)}><span>{idx+1}. {step.title}</span><small className="timeline-schedule">{taskTimeLabel({...step,timeZone:task.timeZone})}</small></button><em>{step.progress}%</em></div>
          <SpanBar item={step} days={days} onSelect={()=>onSelect(task)}/>
        </div>)}
      </div>)}
      {!tasks.length && <p className="empty-state">{readOnly ? 'Người này chưa có công việc.' : 'Chưa có công việc. Chọn “Thêm công việc” để bắt đầu.'}</p>}
    </BoundedTaskList></div></div></>}
  </section>
}
