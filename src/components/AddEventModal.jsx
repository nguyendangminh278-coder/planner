import { useState } from 'react';
import { X } from 'lucide-react';
import { dateKey } from '../lib/date';
import { firebaseError } from '../lib/firebase';
import ColorPicker from './ColorPicker';

export default function AddEventModal({ onClose, onAdd, onDelete, item, initialDate }) {
  const localTime = value => new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const [form, setForm] = useState(item ? { title: item.title, date: dateKey(new Date(item.start)), start: localTime(item.start), end: localTime(item.end), color: item.color || '#cffafe' } : { title: '', date: initialDate || dateKey(new Date()), start: '09:00', end: '10:00', color: '#cffafe' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || form.end <= form.start) return setError('Điền tên lịch và chọn giờ kết thúc sau giờ bắt đầu.');
    setBusy(true); setError('');
    try {
      await onAdd({ title: form.title.trim(), start: new Date(`${form.date}T${form.start}`).toISOString(), end: new Date(`${form.date}T${form.end}`).toISOString(), color: form.color }, item?.id);
      onClose();
    } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm('Xóa lịch này?')) return;
    setBusy(true); setError('');
    try { await onDelete(item.id); onClose(); } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={() => !busy && onClose()}><form className="modal" role="dialog" aria-modal="true" aria-label={item ? 'Sửa lịch' : 'Thêm lịch'} onClick={e => e.stopPropagation()} onSubmit={submit}>
    <button type="button" className="icon-btn close" aria-label="Đóng" onClick={onClose} disabled={busy}><X size={20}/></button><span className="eyebrow">CALENDAR EVENT</span><h2>{item ? 'Sửa lịch' : 'Thêm lịch'}</h2>
    <label>Tên lịch<input required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
    <label>Ngày<input required type="date" value={form.date} onInput={e => setForm(f => ({ ...f, date: e.target.value }))} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}/></label>
    <div className="two"><label>Từ<input required type="time" value={form.start} onInput={e => setForm(f => ({ ...f, start: e.target.value }))} onChange={e => setForm(f => ({ ...f, start: e.target.value }))}/></label><label>Đến<input required type="time" value={form.end} onInput={e => setForm(f => ({ ...f, end: e.target.value }))} onChange={e => setForm(f => ({ ...f, end: e.target.value }))}/></label></div>
    <ColorPicker value={form.color} onChange={color => setForm(current => ({ ...current, color }))}/>
    {error && <p className="error-message" role="alert">{error}</p>}<button className="primary-btn" disabled={busy}>{busy ? 'Đang lưu…' : item ? 'Lưu lịch' : 'Thêm vào lịch'}</button>
    {item && <button type="button" className="text-btn danger" disabled={busy} onClick={remove}>Xóa lịch</button>}
  </form></div>;
}
