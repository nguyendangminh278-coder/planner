import { Check, Trash2 } from 'lucide-react';

export function CompletionButton({ title, completed, onToggle, busy=false }) {
  return <button type="button" role="checkbox" aria-checked={completed} aria-label={`${completed ? 'Bỏ hoàn thành' : 'Hoàn thành'}: ${title}`} className={`task-completion ${completed ? 'checked' : ''}`} disabled={!onToggle || busy} onClick={onToggle}>{completed && <Check size={15}/>}</button>;
}

export function DeleteTaskButton({ title, onDelete, busy=false }) {
  return onDelete && <button type="button" className="task-delete" aria-label={`Xóa công việc: ${title}`} title="Xóa công việc" disabled={busy} onClick={onDelete}><Trash2 size={16}/></button>;
}

export function TaskDeleteDialog({ title, onCancel, onConfirm, busy, error, classTask=false }) {
  return <div className="modal-backdrop" onClick={() => !busy && onCancel()}><section className="modal task-delete-dialog" role="dialog" aria-modal="true" aria-label="Xác nhận xóa công việc" onClick={event => event.stopPropagation()}><h2>{classTask ? 'Xóa khỏi Planner của bạn?' : 'Xóa công việc?'}</h2><p>{title}</p>{!classTask && <small>Các bước và ghi chú trong công việc cũng sẽ bị xóa.</small>}{error && <p className="error-message" role="alert">{error}</p>}<div className="task-delete-actions"><button type="button" className="soft-btn" disabled={busy} onClick={onCancel}>Hủy</button><button type="button" className="primary-btn" disabled={busy} onClick={onConfirm}>{busy ? 'Đang xóa…' : 'Xóa công việc'}</button></div></section></div>;
}
