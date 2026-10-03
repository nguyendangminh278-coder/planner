import { Clock3, Repeat2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { dateKey, fmtFull, intersectsDay } from '../lib/date';
import { dayStyle } from '../lib/theme';
import { occurrenceTimeLabel } from '../lib/recurrence';

const hours = Array.from({length:24},(_,i)=>i);
function blockStyle(event, day) {
  const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
  const nextDay = new Date(dayStart); nextDay.setDate(nextDay.getDate()+1);
  const s = new Date(Math.max(new Date(event.start), dayStart)), e = new Date(Math.min(new Date(event.end), nextDay));
  const startMin = s.getHours()*60 + s.getMinutes();
  const duration = Math.max(15, (e-s)/60000);
  return { top: `${Math.max(0,startMin) * 1.18}px`, height: `${duration * 1.18}px`, background:event.color || '#dce9ff' };
}
export default function CalendarWeek({ days, events, externalEvents, showExternal, onSelect, hideHeader=false, comparison=false }) {
  const all = showExternal ? [...events, ...externalEvents] : events;
  const allDay = all.filter(event => event.allDay), timed = all.filter(event => !event.allDay);
  const scrollArea = useRef(null);
  useEffect(()=>{ if(scrollArea.current) scrollArea.current.scrollTop=8*70.8; },[]);
  return <section className="week-section">
    {!hideHeader && <div className="section-head"><div><span className="eyebrow">WEEK CALENDAR</span><h2>Lịch tuần</h2></div></div>}
    <div className="calendar-grid-wrap" ref={scrollArea}><div className={`calendar-grid ${comparison ? 'comparison-grid' : ''}`} style={{'--week-count':days.length}}>
      <div className="time-head"/>
      {days.map((d,index) => <div className="day-head" style={dayStyle(index)} key={dateKey(d)}><strong>{fmtFull(d).split(',')[0]}</strong><span>{d.getDate()}/{d.getMonth()+1}</span></div>)}
      {!!allDay.length && <><div className="all-day-label">Cả ngày</div>{days.map((day,index) => <div className="all-day-cell" style={dayStyle(index)} key={`all-${dateKey(day)}`}>{allDay.filter(event => intersectsDay(event.start,event.end,day)).map(event => <button type="button" key={event.id} style={{background:event.color}} title={`${event.title} · ${event.owner || ''}`} onClick={() => onSelect(event)}>{event.recurrence && <Repeat2 size={10}/>}<span>{event.title}</span></button>)}</div>)}</>}
      <div className="time-col">{hours.map(h => <div className="time-label" key={h}>{String(h).padStart(2,'0')}:00</div>)}</div>
      {days.map((day,index) => <div className="day-col" style={dayStyle(index)} key={dateKey(day)}>
        {hours.map(h => <div className="hour-line" key={h}/>)}
        {timed.filter(event=>intersectsDay(event.start,event.end,day)).map(event => <button type="button" onClick={()=>onSelect(event)} className={`event ${event.source==='external'?'external':''} ${event.source?'readonly':''}`} style={{...blockStyle(event,day),...(comparison ? event.source === 'comparison-self' ? {left:'5px',right:'calc(50% + 3px)'} : {left:'calc(50% + 3px)',right:'5px'} : {})}} key={event.id} title={`${event.title} · ${event.owner || ''}`} aria-label={`${event.title}${event.source ? ' (chỉ xem)' : ' — sửa lịch'}`}>
          <b>{event.title}</b><span><Clock3 size={12}/>{occurrenceTimeLabel(event)}{event.recurrence && <Repeat2 size={10}/>}</span><em>{event.owner || ''}</em>
        </button>)}
      </div>)}
    </div></div>
  </section>;
}
