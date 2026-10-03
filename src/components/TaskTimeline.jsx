import { ChevronDown, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { clipToWeek, dateKey } from '../lib/date';

function SpanBar({item, days, parent=false, onSelect}) {
  const span = clipToWeek(item.start, item.end, days);
  if (!span) return null;
  return <button onClick={()=>onSelect(item)} className={`timeline-bar ${parent?'parent':''}`} style={{ gridColumn:`${span.startIndex+2} / ${span.endIndex+3}`, background:item.color }}>
    <span>{item.title}</span><small>{item.start.slice(5).replace('-','/')} → {item.end.slice(5).replace('-','/')}</small>
    <i style={{width:`${item.progress||0}%`}}></i>
  </button>
}

function TaskLinks({task, days}) {
  const parent = clipToWeek(task.start, task.end, days);
  if (!parent) return null;
  const steps = task.steps || [], height = 48 * (steps.length + 1);
  const stem = parent.startIndex * 100 + 12;
  const visible = steps.map((step, index) => ({ span: clipToWeek(step.start, step.end, days), index })).filter(step => step.span);
  return <svg className="task-links" viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" style={{height}} aria-hidden="true">
    {visible.map(({span,index}) => <path key={`parent-${index}`} d={`M ${stem} 24 V ${72 + index*48} H ${span.startIndex*100+12}`} className="parent-connector"/>)}
    {steps.slice(1).map((step,index) => {
      const previous = clipToWeek(steps[index].start, steps[index].end, days), next = clipToWeek(step.start, step.end, days);
      return previous && next ? <path key={`next-${index}`} d={`M ${previous.endIndex*100+88} ${72+index*48} V ${96+index*48} H ${next.startIndex*100+12} V ${120+index*48}`} className="step-connector"/> : null;
    })}
  </svg>;
}

export default function TaskTimeline({days, tasks, onSelect, readOnly=false}) {
  const [open,setOpen]=useState({});
  return <section className="timeline-section">
    <div className="section-head"><div><span className="eyebrow">3-LEVEL TODO</span><h2>Việc đang chạy</h2></div><p>Bậc 1 ở trên, các bước bậc 2 chạy nối tiếp bên dưới; click để xem nội dung chi tiết bậc 3.</p></div>
    <div className="timeline-head"><span>Công việc</span>{days.map(d=><span key={dateKey(d)}>{d.toLocaleDateString('vi-VN',{weekday:'short'})}<b>{d.getDate()}</b></span>)}</div>
    <div className="timeline-body">
      {tasks.map(task => <div className="task-group" key={task.id}>
        {(open[task.id] ?? true) && <TaskLinks task={task} days={days}/>}
        <div className="timeline-row parent-row">
          <div className="task-label"><button className="icon-btn" aria-label={`Ẩn/hiện bước: ${task.title}`} onClick={()=>setOpen(o=>({...o,[task.id]:!(o[task.id] ?? true)}))}>{(open[task.id] ?? true)?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</button><button className="text-btn" onClick={()=>onSelect(task)}>{task.title}</button><span>{task.progress}%</span></div>
          <SpanBar item={task} days={days} parent onSelect={onSelect}/>
        </div>
        {(open[task.id] ?? true) && task.steps?.map((step,idx)=><div className="timeline-row child-row" key={step.id}>
          <button className="task-label child" onClick={()=>onSelect(task)}>{step.progress===100?<CheckCircle2 size={15}/>:<Circle size={15}/>}<span>{idx+1}. {step.title}</span><em>{step.progress}%</em></button>
          <SpanBar item={step} days={days} onSelect={()=>onSelect(task)}/>
        </div>)}
      </div>)}
      {!tasks.length && <p className="empty-state">{readOnly ? 'Người này chưa có công việc.' : 'Chưa có công việc. Chọn “Thêm công việc” để bắt đầu.'}</p>}
    </div>
  </section>
}
