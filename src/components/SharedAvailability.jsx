import { useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { sharedAvailability } from '../lib/availability';
import { fmtShort } from '../lib/date';
import { dayStyle } from '../lib/theme';

const time = value => new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
export default function SharedAvailability({ days, mine, theirs, ready, peerName }) {
  const [from, setFrom] = useState('08:00'), [to, setTo] = useState('18:00'), [minimum, setMinimum] = useState(30);
  const result = useMemo(() => {
    if (!ready) return { rows: [], error: '' };
    try { return { rows: sharedAvailability(days, mine, theirs, { from, to, minimum }), error: '' }; }
    catch (err) { return { rows: [], error: err.message }; }
  }, [days, mine, theirs, ready, from, to, minimum]);
  return <section className="shared-availability" aria-label="Khoảng trống chung"><div className="section-head"><div><span className="eyebrow">FIND TIME TOGETHER</span><h2><Clock3 size={20}/>Cả hai cùng trống</h2></div><span className="availability-pair">Bạn & {peerName}</span></div>
    <div className="availability-controls"><label>Từ<input type="time" value={from} onInput={e => setFrom(e.target.value)} onChange={e => setFrom(e.target.value)}/></label><label>Đến<input type="time" value={to} onInput={e => setTo(e.target.value)} onChange={e => setTo(e.target.value)}/></label><label>Tối thiểu<select value={minimum} onChange={e => setMinimum(Number(e.target.value))}><option value={15}>15 phút</option><option value={30}>30 phút</option><option value={60}>60 phút</option></select></label></div>
    <p className="availability-note">Tính theo lịch cá nhân của hai người, gồm lịch lặp và lịch cả ngày. Khoảng ngày của công việc không được xem là bận cả ngày.</p>
    {!ready && <p role="status">Chưa tải đủ hai lịch để xác định khoảng trống chung.</p>}{result.error && <p className="error-message" role="alert">{result.error}</p>}
    {ready && !result.error && <div className="availability-days" style={{'--week-count':days.length}}>{result.rows.map((row, index) => <div key={row.date} style={dayStyle(index)}><header><b>{days[index].toLocaleDateString('vi-VN', { weekday: 'short' })}</b><span>{fmtShort(days[index])}</span></header>{row.slots.length ? <ul>{row.slots.map(slot => <li key={slot.start}><time>{time(slot.start)}–{time(slot.end)}</time><small>{slot.minutes} phút</small></li>)}</ul> : <p>Không có khoảng trống đủ dài.</p>}</div>)}</div>}
  </section>;
}
