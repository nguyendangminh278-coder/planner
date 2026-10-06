import { Check, Trash2 } from 'lucide-react';
import {useState} from 'react';
import {usePlannerMascot,mascotTarget} from './PlannerMascot';

export function CompletionButton({ title, completed, onToggle, busy=false }) {
  const mascot=usePlannerMascot(),[acting,setActing]=useState(false);
  async function click(event){
    if(completed || !mascot)return onToggle?.();
    const target=mascotTarget(event.currentTarget);setActing(true);
    try{await mascot.runAction({kind:'complete',target,commit:onToggle});}finally{setActing(false);}
  }
  return <button type="button" role="checkbox" aria-checked={completed} aria-label={`${completed ? 'Bỏ hoàn thành' : 'Hoàn thành'}: ${title}`} className={`task-completion ${completed ? 'checked' : ''}`} disabled={!onToggle || busy || acting || mascot?.busy} onClick={click}>{completed && <Check size={15}/>}</button>;
}

export function DeleteTaskButton({ title, onDelete, busy=false }) {
  const mascot=usePlannerMascot();
  return onDelete && <button type="button" className="task-delete" aria-label={`Xóa công việc: ${title}`} title="Xóa công việc" disabled={busy || mascot?.busy} onClick={event=>{mascot?.rememberDelete(event.currentTarget);onDelete();}}><Trash2 size={16}/></button>;
}

export function TaskDeleteDialog({ title, onCancel, onConfirm, busy, error, classTask=false }) {
  const mascot=usePlannerMascot(),[acting,setActing]=useState(false);
  async function confirm(){
    setActing(true);
    try{if(mascot)await mascot.runAction({kind:'delete',target:mascot.deleteTarget.current,commit:onConfirm});else await onConfirm();}
    finally{setActing(false);}
  }
  if(acting)return null;
  return <div className="modal-backdrop" onClick={() => !busy && onCancel()}><section className="modal task-delete-dialog" role="dialog" aria-modal="true" aria-label="Xác nhận xóa công việc" onClick={event => event.stopPropagation()}><h2>{classTask ? 'Xóa khỏi Planner của bạn?' : 'Xóa công việc?'}</h2><p>{title}</p>{!classTask && <small>Các bước và ghi chú trong công việc cũng sẽ bị xóa.</small>}{error && <p className="error-message" role="alert">{error}</p>}<div className="task-delete-actions"><button type="button" className="soft-btn" disabled={busy} onClick={onCancel}>Hủy</button><button type="button" className="primary-btn" disabled={busy} onClick={confirm}>{busy ? 'Đang xóa…' : 'Xóa công việc'}</button></div></section></div>;
}
