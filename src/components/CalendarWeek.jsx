import { Clock3 } from 'lucide-react';
import { dateKey, fmtFull, intersectsDay } from '../lib/date';

const hours = [8,9,10,11,12,13,14,15,16,17,18];

function blockStyle(event) {
  const s = new Date(event.start), e = new Date(event.end);
  const startMin = (s.getHours()-8)*60 + s.getMinutes();
  const duration = Math.max(30, (e-s)/60000);
  return { top: `${Math.max(0,startMin) * 1.18}px`, height: `${duration * 1.18}px`, background:event.color || '#dce9ff' };
}

export default function CalendarWeek({ days, events, externalEvents, showExternal }) {
  const all = showExternal ? [...events, ...externalEvents] : events;
  return <section className="week-section">
    <div className="section-head">
      <div><span className="eyebrow">WEEK CALENDAR</span><h2>Lịch tuần</h2></div>
      <div className="legend"><span className="dot mine"></span>Lịch của bạn <span className="dot shared"></span>Được chia sẻ <span className="dot api"></span>Lịch nhóm API</div>
    </div>
    <div className="calendar-grid">
      <div className="time-head"></div>
      {days.map(d => <div className="day-head" key={dateKey(d)}><strong>{fmtFull(d).split(',')[0]}</strong><span>{d.getDate()}/{d.getMonth()+1}</span></div>)}
      <div className="time-col">{hours.map(h => <div className="time-label" key={h}>{String(h).padStart(2,'0')}:00</div>)}</div>
      {days.map(day => <div className="day-col" key={dateKey(day)}>
        {hours.map(h => <div className="hour-line" key={h}></div>)}
        {all.filter(e=>intersectsDay(e.start,e.end,day)).map(e => <div className={`event ${e.source==='external'?'external':''}`} style={blockStyle(e)} key={e.id} title={`${e.title} • ${e.owner||''}`}>
          <b>{e.title}</b><span><Clock3 size={12}/>{new Date(e.start).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}–{new Date(e.end).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</span><em>{e.owner||''}</em>
        </div>)}
      </div>)}
    </div>
  </section>
}
