import { X, CalendarDays, Clock3 } from 'lucide-react';

export default function EventDetails({ item, onClose }) {
  const label = value => new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return <div className="modal-backdrop" onClick={onClose}><section className="modal event-details" role="dialog" aria-modal="true" aria-label="Chi tiết lịch chỉ xem" onClick={e => e.stopPropagation()}><button className="icon-btn close" aria-label="Đóng chi tiết lịch" onClick={onClose}><X size={20}/></button><span className="eyebrow">LỊCH · CHỈ XEM</span><h2>{item.title}</h2><p><CalendarDays size={16}/>{label(item.start)}</p><p><Clock3 size={16}/>Đến {label(item.end)}</p><p>{item.owner || 'Lịch được chia sẻ'}</p></section></div>;
}
