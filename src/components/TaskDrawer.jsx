import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { dateKey } from '../lib/date';
import { firebaseError } from '../lib/firebase';
import ColorPicker from './ColorPicker';
import { plannerColors } from '../lib/theme';
import { CompletionButton, TaskDeleteDialog } from './TaskActions';
import {usePlannerMascot} from './PlannerMascot';
import { isTaskComplete, taskCompletionPatch, stepCompletionPatch, stepsProgress, clearCompletionBackup } from '../lib/taskActions';
import { taskForm, taskScheduleData, scheduleDefaults, taskRangeLabel } from '../lib/taskSchedule';
import TaskScheduleFields from './TaskScheduleFields';

export default function TaskDrawer({ item, onClose, onSave, onDelete, readOnly=false, ownerName='' }) {
  const today = dateKey(new Date());
  const [form, setForm] = useState(() => taskForm(item,today));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [deleteOpen,setDeleteOpen]=useState(false),mascot=usePlannerMascot();
  const change = (key, value) => setForm(f => ({ ...f, [key]: key === 'steps' ? value.map(clearCompletionBackup) : value, ...(key === 'steps' ? {progress:value.length ? stepsProgress(value) : f.progress, previousProgress:null} : {}) }));
  const changeStep = (id, key, value) => setForm(f => {
    const steps = f.steps.map(step => { const s = key === 'progress' ? clearCompletionBackup(step) : step; return s.id === id ? {...s,[key]:key === 'progress' ? Number(value) : value,...(key === 'progress' ? {previousProgress:null} : {})} : s; });
    return {...f,steps,...(key === 'progress' ? {progress:stepsProgress(steps),previousProgress:null} : {})};
  });
  async function submit(e) {
    e.preventDefault();
    let data;
    try { data = taskScheduleData(form); } catch (err) { return setError(err.message); }
    setBusy(true); setError('');
    try { await onSave(data, item?.id); onClose(); } catch (err) { setError(firebaseError(err)); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await onDelete(item.id); onClose(); return true; } catch (err) { setError(firebaseError(err)); return false; } finally { setBusy(false); }
  }
  if (readOnly) return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer shared-task-detail" role="dialog" aria-modal="true" aria-label="Chi tiết công việc chỉ xem" onClick={e => e.stopPropagation()}>
    <button className="icon-btn close" aria-label="Đóng" onClick={onClose}><X size={20}/></button><span className="eyebrow">CÔNG VIỆC CỦA {ownerName} · CHỈ XEM</span><h2>{item.title}</h2>
    <p className="shared-task-dates">{taskRangeLabel(item)} · {item.progress || 0}% hoàn thành</p><p className="shared-task-notes">{item.details || 'Chưa có ghi chú.'}</p>
    <h3>Các bước & nội dung chi tiết</h3>{item.steps?.map((step,index) => <article className={`shared-step ${isTaskComplete(step) ? 'is-completed' : ''}`} key={step.id}><div className="step-completion-heading"><CompletionButton title={`Bước ${index+1}: ${step.title}`} completed={isTaskComplete(step)}/><h4 className="task-title">{index+1}. {step.title}</h4></div><p>{taskRangeLabel({...step,timeZone:item.timeZone})} · {step.progress || 0}%</p><div className="shared-task-notes">{step.details || 'Chưa có nội dung chi tiết.'}</div></article>)}
    {!item.steps?.length && <p>Chưa có bước nhỏ.</p>}
  </aside></div>;
  return <div className="drawer-backdrop" onClick={() => !busy && onClose()}><aside className="drawer" role="dialog" aria-modal="true" aria-label="Công việc" onClick={e => e.stopPropagation()}>
    <button className="icon-btn close" aria-label="Đóng" onClick={onClose} disabled={busy}><X size={20}/></button>
    <span className="eyebrow">CÔNG VIỆC 3 TẦNG</span><h2>{item?.id ? 'Cập nhật công việc' : 'Thêm công việc'}</h2>
    <form onSubmit={submit} className="task-form">
      <div className="step-completion-heading"><CompletionButton title={form.title || 'Công việc'} completed={isTaskComplete(form)} busy={busy} onToggle={() => setForm(f => ({...f,...taskCompletionPatch(f)}))}/><span>Hoàn thành cả công việc và các bước</span></div>
      <label>Tên công việc<input required maxLength={200} value={form.title} onInput={e => change('title', e.target.value)}/></label>
      <TaskScheduleFields label="Công việc" value={form} disabled={busy} onChange={patch => setForm(f => ({...f,...patch}))}/>
      <label>Múi giờ<select value={form.timeZone} disabled={busy} onChange={event => change('timeZone',event.target.value)}>{[...new Set([form.timeZone,'Asia/Bangkok','Asia/Ho_Chi_Minh','Asia/Tokyo','Europe/London','America/New_York','UTC'])].map(zone => <option key={zone} value={zone}>{zone}</option>)}</select><small>Áp dụng cho công việc và các bước.</small></label>
      <label>Tiến độ (%)<input required type="number" min="0" max="100" readOnly={!!form.steps.length} value={form.progress} onInput={e => change('progress', e.target.value)}/>{!!form.steps.length && <small>Tự tính khi cập nhật các bước.</small>}</label>
      <label>Ghi chú / checklist<textarea maxLength={20000} value={form.details} onInput={e => change('details', e.target.value)}/></label>
      <ColorPicker value={form.color} onChange={color => change('color', color)}/>
      <h3>Các bước thực hiện</h3>
      {form.steps.map((step, index) => <fieldset className="step-editor" key={step.id}><legend>Bước {index + 1}</legend>
        <div className={`step-completion-heading ${isTaskComplete(step) ? 'is-completed' : ''}`}><CompletionButton title={`Bước ${index+1}: ${step.title || 'Bước mới'}`} completed={isTaskComplete(step)} busy={busy} onToggle={() => setForm(f => ({...f,...stepCompletionPatch(f,step.id)}))}/><span className="task-title">{isTaskComplete(step) ? 'Đã hoàn thành bước này' : 'Đánh dấu hoàn thành bước này'}</span></div>
        <label>Tên bước<input required maxLength={200} value={step.title} onInput={e => changeStep(step.id, 'title', e.target.value)}/></label>
        <TaskScheduleFields label={`Bước ${index+1}`} value={step} disabled={busy} onChange={patch => setForm(f => ({...f,steps:f.steps.map(s => s.id === step.id ? {...s,...patch} : s)}))}/>
        <label>Tiến độ bước (%)<input required type="number" min="0" max="100" value={step.progress} onInput={e => changeStep(step.id, 'progress', e.target.value)}/></label>
        <label>Nội dung bậc 3<textarea maxLength={20000} value={step.details || ''} onInput={e => changeStep(step.id, 'details', e.target.value)}/></label>
        <ColorPicker value={step.color} onChange={color => changeStep(step.id, 'color', color)}/>
        <button type="button" className="text-btn danger" disabled={busy || mascot?.busy} onClick={() => change('steps', form.steps.filter(s => s.id !== step.id))}><Trash2 size={14}/>Bỏ bước</button>
      </fieldset>)}
      <button type="button" className="soft-btn" disabled={busy || mascot?.busy || form.steps.length >= 30} onClick={() => change('steps', [...form.steps, scheduleDefaults({ id: crypto.randomUUID(), title: '', start: form.start, end: form.end, allDay:form.allDay, startTime:form.startTime, endTime:form.endTime, progress: 0, details: '', color: plannerColors[(form.steps.length+1)%plannerColors.length].value },form.timeZone)])}><Plus size={16}/>Thêm bước</button>
      {error && <p className="error-message" role="alert">{error}</p>}
      <p className="step-save-note">Các dấu tích trong bảng này được lưu khi bấm “Lưu cập nhật”.</p><button className="primary-btn" disabled={busy || mascot?.busy}>{busy ? 'Đang lưu…' : 'Lưu cập nhật'}</button>
      {item?.id && <button type="button" className="text-btn danger" onClick={()=>{mascot?.prepareDeleteForId(item.id);setError('');setDeleteOpen(true);}} disabled={busy || mascot?.busy}>Xóa công việc</button>}
    </form>
  </aside>{deleteOpen && <TaskDeleteDialog title={form.title} busy={busy} error={error} onCancel={()=>setDeleteOpen(false)} onConfirm={remove}/>}</div>;
}
