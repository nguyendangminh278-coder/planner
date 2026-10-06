import { useState } from 'react';
import { X } from 'lucide-react';
import { dateKey } from '../lib/date';
import { firebaseError } from '../lib/firebase';
import ColorPicker from './ColorPicker';
import RecurrenceDialog from './RecurrenceDialog';
import { buildEventData, eventForm, presetRecurrence, recurrenceSummary, weekdayNames, monthlyWeekdayLabel } from '../lib/recurrence';
import { DateTime } from 'luxon';

export default function AddEventModal({ onClose, onAdd, onDelete, item, initialDate }) {
  const [form, setForm] = useState(() => eventForm(item, initialDate || dateKey(new Date())));
  const [preset, setPreset] = useState(item?.recurrence ? 'custom' : 'none');
  const [customRule, setCustomRule] = useState(item?.recurrence || null), [customOpen, setCustomOpen] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const anchor = DateTime.fromISO(form.date);
  const rule = preset === 'custom' ? customRule : presetRecurrence(preset, form.date);
  const zones = [...new Set([form.timeZone,'Asia/Bangkok','Asia/Ho_Chi_Minh','Asia/Tokyo','Europe/London','America/New_York','UTC'])];
  function changeDate(value) { setForm(current => ({ ...current, date: value, endDate: current.endDate === current.date || current.endDate < value ? value : current.endDate })); }
  async function submit(e) {
    e.preventDefault();
    let data;
    try { data = buildEventData(form, rule); } catch (err) { return setError(err.message); }
    setBusy(true); setError('');
    try {
      await onAdd(data, item?.id);
      onClose();
    } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(item.recurrence ? 'Xóa toàn bộ chuỗi lịch lặp này?' : 'Xóa lịch này?')) return;
    setBusy(true); setError('');
    try { await onDelete(item.id); onClose(); } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={() => !busy && !customOpen && onClose()}><form className="modal event-modal" role="dialog" aria-modal="true" aria-label={item ? 'Sửa lịch' : 'Thêm lịch'} onClick={e => e.stopPropagation()} onSubmit={submit}>
    <button type="button" className="icon-btn close" aria-label="Đóng" onClick={onClose} disabled={busy}><X size={20}/></button><span className="eyebrow">CALENDAR EVENT</span><h2>{item ? 'Sửa lịch' : 'Thêm lịch'}</h2>
    <label>Tên lịch<input required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
    <div className="two"><label>Ngày bắt đầu<input required type="date" max="9999-12-31" value={form.date} onInput={e => changeDate(e.target.value)} onChange={e => changeDate(e.target.value)}/></label><label>Ngày kết thúc<input required type="date" min={form.date} max="9999-12-31" value={form.endDate} onInput={e => setForm(f => ({ ...f, endDate: e.target.value }))} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}/></label></div>
    <div className="event-repeat-row"><label className="event-all-day"><input type="checkbox" checked={form.allDay} onChange={e => setForm(current => ({ ...current, allDay: e.target.checked }))}/>Cả ngày</label><select aria-label="Lặp lại" value={preset} onChange={e => { if (e.target.value === 'custom') setCustomOpen(true); else setPreset(e.target.value); }}><option value="none">Không lặp lại</option><option value="daily">Hằng ngày</option><option value="weekly">Hằng tuần vào {weekdayNames[anchor.weekday-1] || 'ngày đã chọn'}</option><option value="monthly-weekday">Hằng tháng vào {monthlyWeekdayLabel(form.date)}</option><option value="yearly">Hằng năm vào ngày {anchor.day || ''} tháng {anchor.month || ''}</option><option value="weekdays">Mọi ngày trong tuần (T2–T6)</option><option value="custom">Tùy chỉnh…</option></select></div>
    {preset === 'custom' && <button type="button" className="text-btn repeat-edit" onClick={() => setCustomOpen(true)}>{recurrenceSummary(customRule, form.date)} · Chỉnh sửa</button>}
    {!form.allDay && <div className="two"><label>Từ<input required type="time" value={form.start} onInput={e => setForm(f => ({ ...f, start: e.target.value }))} onChange={e => setForm(f => ({ ...f, start: e.target.value }))}/></label><label>Đến<input required type="time" value={form.end} onInput={e => setForm(f => ({ ...f, end: e.target.value }))} onChange={e => setForm(f => ({ ...f, end: e.target.value }))}/></label></div>}
    <label>Múi giờ<select value={form.timeZone} onChange={e => setForm(current => ({ ...current, timeZone: e.target.value }))}>{zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}</select></label>
    {item?.recurrence && <p className="series-edit-note">Bạn đang sửa cả chuỗi, bắt đầu từ {form.date?.split('-').reverse().join('/')}.</p>}
    <label>Ghi chú<textarea maxLength={20000} rows={4} placeholder="Nội dung cần chuẩn bị, địa điểm hoặc lưu ý cho lịch này…" value={form.notes} onInput={e => setForm(current => ({...current,notes:e.target.value}))} onChange={e => setForm(current => ({...current,notes:e.target.value}))}/></label>
    <ColorPicker value={form.color} onChange={color => setForm(current => ({ ...current, color }))}/>
    {error && <p className="error-message" role="alert">{error}</p>}<button className="primary-btn" disabled={busy}>{busy ? 'Đang lưu…' : item ? 'Lưu lịch' : 'Thêm vào lịch'}</button>
    {item && <button type="button" className="text-btn danger" disabled={busy} onClick={remove}>{item.recurrence ? 'Xóa cả chuỗi' : 'Xóa lịch'}</button>}
  </form>{customOpen && <RecurrenceDialog date={form.date} value={rule} onCancel={() => setCustomOpen(false)} onDone={next => { setCustomRule(next); setPreset('custom'); setCustomOpen(false); }}/>}</div>;
}
