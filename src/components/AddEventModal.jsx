import { X } from 'lucide-react';
import { useState } from 'react';
export default function AddEventModal({onClose,onAdd}) {
  const [form,setForm]=useState({title:'',date:'2026-10-05',start:'09:00',end:'10:00'});
  const submit=e=>{e.preventDefault(); onAdd({title:form.title,start:`${form.date}T${form.start}:00+07:00`,end:`${form.date}T${form.end}:00+07:00`,color:'#d7e8ff',owner:'Bạn'});onClose()}
  return <div className="modal-backdrop" onClick={onClose}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={submit}><button type="button" className="icon-btn close" onClick={onClose}><X size={20}/></button><span className="eyebrow">NEW EVENT</span><h2>Thêm lịch</h2><label>Tên lịch<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Ngày<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><div className="two"><label>Từ<input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></label><label>Đến<input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></label></div><button className="primary-btn">Thêm vào lịch</button></form></div>
}
