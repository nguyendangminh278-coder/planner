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

export default function TaskTimeline({days, tasks, onSelect}) {
  const [open,setOpen]=useState(()=>Object.fromEntries(tasks.map(t=>[t.id,true])));
  return <section className="timeline-section">
    <div className="section-head"><div><span className="eyebrow">3-LEVEL TODO</span><h2>Việc đang chạy</h2></div><p>Bậc 1 ở trên, các bước bậc 2 chạy nối tiếp bên dưới; click để xem nội dung chi tiết bậc 3.</p></div>
    <div className="timeline-head"><span>Công việc</span>{days.map(d=><span key={dateKey(d)}>{d.toLocaleDateString('vi-VN',{weekday:'short'})}<b>{d.getDate()}</b></span>)}</div>
    <div className="timeline-body">
      {tasks.map(task => <div className="task-group" key={task.id}>
        <div className="timeline-row parent-row">
          <button className="task-label" onClick={()=>setOpen(o=>({...o,[task.id]:!o[task.id]}))}>{open[task.id]?<ChevronDown size={16}/>:<ChevronRight size={16}/>}<strong>{task.title}</strong><span>{task.progress}%</span></button>
          <SpanBar item={task} days={days} parent onSelect={onSelect}/>
        </div>
        {open[task.id] && task.steps?.map((step,idx)=><div className="timeline-row child-row" key={step.id}>
          <button className="task-label child" onClick={()=>onSelect(step)}>{step.progress===100?<CheckCircle2 size={15}/>:<Circle size={15}/>}<span>{idx+1}. {step.title}</span><em>{step.progress}%</em></button>
          <SpanBar item={step} days={days} onSelect={onSelect}/>
        </div>)}
      </div>)}
    </div>
  </section>
}
