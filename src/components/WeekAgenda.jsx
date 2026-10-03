import { useState } from 'react';
import { Clock3, Users, CalendarDays } from 'lucide-react';
import { dateKey, fmtShort, intersectsDay } from '../lib/date';
import { dayStyle } from '../lib/theme';

export default function WeekAgenda({ days, events, onSelect, onAdd }) {
  const today = dateKey(new Date());
  const [expanded, setExpanded] = useState(today);
  return <div className="week-agenda">{days.map((day, index) => {
    const key = dateKey(day), rows = events.filter(event => intersectsDay(event.start, event.end, day)).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    return <article className={`agenda-day ${expanded === key ? 'expanded' : ''} ${key === today ? 'today' : ''}`} key={key} style={dayStyle(index)}>
      <button type="button" className="agenda-day-head" onClick={() => setExpanded(value => value === key ? '' : key)} aria-expanded={expanded === key} aria-label={`Mở rộng ${day.toLocaleDateString('vi-VN', { weekday: 'long' })} ${fmtShort(day)}`}><b>{day.toLocaleDateString('vi-VN', { weekday: 'long' })}</b><time dateTime={key}>{fmtShort(day)}{key === today ? ' · Hôm nay' : ''}</time></button>
      <div className="agenda-events">{rows.length ? rows.map(event => <button type="button" className="agenda-event" key={event.id} onClick={() => { if (!event.source) onSelect(event); }} style={{ borderLeftColor: event.color || 'var(--day-border)' }} aria-label={`${event.title}${event.source ? ' (chỉ xem)' : ' — sửa lịch'}`} title={`${event.title} · ${event.owner || ''}`}><span className="agenda-event-time"><Clock3 size={11}/>{new Date(event.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}–{new Date(event.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span><b>{event.title}</b><small>{event.source ? <Users size={10}/> : null}{event.owner || 'Lịch cá nhân'}</small></button>) : <span className="agenda-empty">Chưa có lịch</span>}</div>
      <button type="button" className="agenda-add" onClick={() => onAdd(key)} aria-label={`Thêm lịch ngày ${key}`}><CalendarDays size={13}/><span>Thêm lịch</span></button>
    </article>;
  })}</div>;
}
