import { X, CalendarDays, Clock3 } from 'lucide-react';
import { DateTime } from 'luxon';
import { recurrenceSummary } from '../lib/recurrence';

export default function EventDetails({ item, onClose }) {
  const label = value => new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const master = item.sourceEvent || item;
  const seedDate = DateTime.fromISO(master.start, { zone: master.timeZone }).toISODate();
  return <div className="modal-backdrop" onClick={onClose}><section className="modal event-details" role="dialog" aria-modal="true" aria-label="Chi tiết lịch chỉ xem" onClick={e => e.stopPropagation()}><button className="icon-btn close" aria-label="Đóng chi tiết lịch" onClick={onClose}><X size={20}/></button><span className="eyebrow">LỊCH · CHỈ XEM</span><h2>{item.title}</h2>{item.allDay ? <p><CalendarDays size={16}/>Cả ngày · {DateTime.fromISO(item.start).toFormat('dd/MM/yyyy')} → {DateTime.fromISO(item.end).minus({days:1}).toFormat('dd/MM/yyyy')}</p> : <><p><CalendarDays size={16}/>{label(item.start)}</p><p><Clock3 size={16}/>Đến {label(item.end)}</p></>}<p>{item.owner || 'Lịch được chia sẻ'}</p>{item.recurrence && <p className="recurrence-detail-note">{recurrenceSummary(item.recurrence,seedDate)} · {master.timeZone}</p>}</section></div>;
}
