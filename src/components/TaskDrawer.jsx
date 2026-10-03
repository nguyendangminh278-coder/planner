import { X, CalendarRange, CheckCircle2 } from 'lucide-react';
export default function TaskDrawer({item,onClose}) {
  if(!item) return null;
  return <div className="drawer-backdrop" onClick={onClose}><aside className="drawer" onClick={e=>e.stopPropagation()}>
    <button className="icon-btn close" onClick={onClose}><X size={20}/></button>
    <span className="eyebrow">CHI TIẾT CÔNG VIỆC</span>
    <h2>{item.title}</h2>
    <div className="drawer-date"><CalendarRange size={17}/>{item.start} → {item.end}</div>
    <div className="progress-line"><i style={{width:`${item.progress||0}%`, background:item.color}}></i></div>
    <b>{item.progress||0}% hoàn thành</b>
    <p>{item.details || 'Chưa có mô tả chi tiết.'}</p>
    <div className="detail-area"><h3>Nội dung bậc 3</h3><label><CheckCircle2 size={15}/> Checklist / ghi chú chi tiết</label><textarea defaultValue={item.details || ''} placeholder="Mô tả đầu việc, checklist, link tài liệu, lưu ý..."/><button className="primary-btn">Lưu cập nhật</button></div>
  </aside></div>
}
