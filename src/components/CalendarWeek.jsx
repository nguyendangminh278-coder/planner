import { Clock3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { dateKey, fmtFull, intersectsDay } from '../lib/date';
import { dayStyle } from '../lib/theme';

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
  const scrollArea = useRef(null);
  useEffect(()=>{ if(scrollArea.current) scrollArea.current.scrollTop=8*70.8; },[]);
  return <section className="week-section">
    {!hideHeader && <div className="section-head">
      <div><span className="eyebrow">WEEK CALENDAR</span><h2>Lịch tuần</h2></div>
      <div className="legend"><span className="dot mine"></span>Lịch của bạn <span className="dot shared"></span>Được chia sẻ <span className="dot api"></span>Lịch nhóm API</div>
    </div>}
    <div className="calendar-grid-wrap" ref={scrollArea}><div className={`calendar-grid ${comparison ? 'comparison-grid' : ''}`}>
      <div className="time-head"></div>
      {days.map((d,index) => <div className="day-head" style={dayStyle(index)} key={dateKey(d)}><strong>{fmtFull(d).split(',')[0]}</strong><span>{d.getDate()}/{d.getMonth()+1}</span></div>)}
      <div className="time-col">{hours.map(h => <div className="time-label" key={h}>{String(h).padStart(2,'0')}:00</div>)}</div>
      {days.map((day,index) => <div className="day-col" style={dayStyle(index)} key={dateKey(day)}>
        {hours.map(h => <div className="hour-line" key={h}></div>)}
        {all.filter(e=>intersectsDay(e.start,e.end,day)).map(e => <button type="button" onClick={()=>onSelect(e)} className={`event ${e.source==='external'?'external':''} ${e.source?'readonly':''}`} style={{...blockStyle(e,day),...(comparison ? e.source === 'comparison-self' ? {left:'5px',right:'calc(50% + 3px)'} : {left:'calc(50% + 3px)',right:'5px'} : {})}} key={e.id} title={`${e.title} • ${e.owner||''}`} aria-label={`${e.title}${e.source ? ' (chỉ xem)' : ' — sửa lịch'}`}>
          <b>{e.title}</b><span><Clock3 size={12}/>{new Date(e.start).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}–{new Date(e.end).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</span><em>{e.owner||''}</em>
        </button>)}
      </div>)}
    </div></div>
  </section>
}
