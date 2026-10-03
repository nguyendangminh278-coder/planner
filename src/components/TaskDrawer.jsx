import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { dateKey } from '../lib/date';
import { firebaseError } from '../lib/firebase';

export default function TaskDrawer({ item, onClose, onSave, onDelete }) {
  const today = dateKey(new Date());
  const [form, setForm] = useState({ title: '', start: today, end: today, progress: 0, details: '', color: '#e8d8f4', steps: [], ...item });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const changeStep = (id, key, value) => change('steps', form.steps.map(s => s.id === id ? { ...s, [key]: value } : s));
  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || form.end < form.start || form.steps.some(s => !s.title.trim() || s.end < s.start || s.start < form.start || s.end > form.end)) return setError('Tên và ngày phải hợp lệ; các bước cần nằm trong thời gian công việc.');
    setBusy(true); setError('');
    const data = { title: form.title.trim(), start: form.start, end: form.end, progress: Number(form.progress), details: form.details, color: form.color, steps: form.steps.map(s => ({ ...s, title: s.title.trim(), progress: Number(s.progress) })) };
    try { await onSave(data, item?.id); onClose(); } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm('Xóa công việc và tất cả các bước bên trong?')) return;
    setBusy(true);
    try { await onDelete(item.id); onClose(); } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  return <div className="drawer-backdrop" onClick={() => !busy && onClose()}><aside className="drawer" role="dialog" aria-modal="true" aria-label="Công việc" onClick={e => e.stopPropagation()}>
    <button className="icon-btn close" aria-label="Đóng" onClick={onClose} disabled={busy}><X size={20}/></button>
    <span className="eyebrow">CÔNG VIỆC 3 TẦNG</span><h2>{item?.id ? 'Cập nhật công việc' : 'Thêm công việc'}</h2>
    <form onSubmit={submit} className="task-form">
      <label>Tên công việc<input required maxLength={200} value={form.title} onInput={e => change('title', e.target.value)}/></label>
      <div className="two"><label>Bắt đầu<input required type="date" value={form.start} onInput={e => change('start', e.target.value)}/></label><label>Kết thúc<input required type="date" value={form.end} onInput={e => change('end', e.target.value)}/></label></div>
      <label>Tiến độ (%)<input required type="number" min="0" max="100" value={form.progress} onInput={e => change('progress', e.target.value)}/></label>
      <label>Ghi chú / checklist<textarea maxLength={20000} value={form.details} onInput={e => change('details', e.target.value)}/></label>
      <h3>Các bước thực hiện</h3>
      {form.steps.map((step, index) => <fieldset className="step-editor" key={step.id}><legend>Bước {index + 1}</legend>
        <label>Tên bước<input required maxLength={200} value={step.title} onInput={e => changeStep(step.id, 'title', e.target.value)}/></label>
        <div className="two"><label>Bắt đầu<input required type="date" value={step.start} onInput={e => changeStep(step.id, 'start', e.target.value)}/></label><label>Kết thúc<input required type="date" value={step.end} onInput={e => changeStep(step.id, 'end', e.target.value)}/></label></div>
        <label>Tiến độ bước (%)<input required type="number" min="0" max="100" value={step.progress} onInput={e => changeStep(step.id, 'progress', e.target.value)}/></label>
        <label>Nội dung bậc 3<textarea maxLength={20000} value={step.details || ''} onInput={e => changeStep(step.id, 'details', e.target.value)}/></label>
        <button type="button" className="text-btn danger" onClick={() => change('steps', form.steps.filter(s => s.id !== step.id))}><Trash2 size={14}/>Bỏ bước</button>
      </fieldset>)}
      <button type="button" className="soft-btn" disabled={form.steps.length >= 30} onClick={() => change('steps', [...form.steps, { id: crypto.randomUUID(), title: '', start: form.start, end: form.end, progress: 0, details: '', color: '#cfe9de' }])}><Plus size={16}/>Thêm bước</button>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-btn" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu cập nhật'}</button>
      {item?.id && <button type="button" className="text-btn danger" onClick={remove} disabled={busy}>Xóa công việc</button>}
    </form>
  </aside></div>;
}
