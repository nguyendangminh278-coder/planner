import {useEffect,useState} from 'react';
import {X,Bell,Smartphone} from 'lucide-react';
import {PlannerAndroid} from '../lib/android';
import {reminderCatalog} from '../lib/mobileAgenda';
const defaults={summaryEnabled:false,showTitles:true,reminders:{}};
const freshRule={enabled:false,minutesBefore:15,allDayTime:'09:00',customAt:''};
export default function AndroidSettings({events,tasks,onClose,onUpdate}) {
  const [settings,setSettings]=useState(null),[status,setStatus]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[key,setKey]=useState('');
  const catalog=reminderCatalog(events,tasks),rule={...freshRule,...settings?.reminders?.[key]};
  async function reload(){const result=await PlannerAndroid.getSettings();setSettings({...defaults,...result.settings});setStatus(result.status);}
  useEffect(()=>{reload().catch(()=>setError('Không đọc được cài đặt Android.'));},[]);
  const changeRule=patch=>setSettings(current=>({...current,reminders:{...current.reminders,[key]:{...freshRule,...current.reminders[key],...patch}}}));
  async function action(fn){setBusy(true);setError('');setMessage('');try{await fn();}catch(err){setError(err.message || 'Không thực hiện được.');}finally{setBusy(false);}}
  async function save(){
    if(rule.enabled&&rule.customAt&&new Date(rule.customAt).getTime()<=Date.now())throw new Error('Chọn giờ hẹn trong tương lai.');
    await PlannerAndroid.updateSettings({settings});onUpdate();await reload();setMessage('Đã lưu widget và giờ nhắc trên điện thoại này.');
  }
  return <div className="modal-backdrop" onClick={()=>!busy&&onClose()}><section className="modal android-settings" role="dialog" aria-modal="true" aria-label="Widget & nhắc việc" onClick={event=>event.stopPropagation()}>
    <button className="icon-btn close" aria-label="Đóng" disabled={busy} onClick={onClose}><X size={20}/></button><span className="eyebrow">PLANNER ANDROID</span><h2><Smartphone size={23}/>Widget & nhắc việc</h2>
    {!settings?<p role="status">Đang đọc cài đặt…</p>:<>
      <h3>Hôm nay trên màn hình</h3><p>Widget hiển thị lịch và việc/bước trong ngày. Bấm một dòng để mở Planner. Nhấn giữ màn hình chính → Widgets → Planner để thêm.</p>
      <button type="button" className="soft-btn" disabled={busy} onClick={()=>action(()=>PlannerAndroid.pinWidget())}>Thêm widget màn hình chính</button>
      <label className="android-toggle"><input type="checkbox" checked={settings.summaryEnabled} onChange={event=>setSettings(current=>({...current,summaryEnabled:event.target.checked}))}/>Hiện bảng hôm nay bằng thông báo trên màn hình khóa</label>
      <label className="android-toggle"><input type="checkbox" checked={settings.showTitles} onChange={event=>setSettings(current=>({...current,showTitles:event.target.checked}))}/>Cho phép hiện tên lịch/việc trên widget và màn hình khóa</label>
      <small>Widget khóa chỉ có trong bộ chọn widget khi Nothing OS hỗ trợ. Thông báo khóa phụ thuộc cài đặt thông báo của điện thoại. Khi tắt hiện tên, màn hình khóa chỉ hiện số lượng việc.</small>
      <h3><Bell size={18}/>Hẹn nhắc lịch / công việc</h3>
      <label>Chọn lịch, việc hoặc bước<select value={key} onChange={event=>setKey(event.target.value)}><option value="">Chọn một mục…</option>{catalog.map(item=><option key={item.key} value={item.key}>{item.kind}: {item.title}{item.completed?' · Đã hoàn thành':''}</option>)}</select></label>
      {key&&<fieldset><label className="android-toggle"><input type="checkbox" checked={rule.enabled} onChange={event=>changeRule({enabled:event.target.checked})}/>Bật nhắc mục này</label>
        <label>Nhắc trước giờ bắt đầu<select value={rule.minutesBefore} onChange={event=>changeRule({minutesBefore:Number(event.target.value)})}>{[0,5,10,15,30,60,120].map(value=><option key={value} value={value}>{value?`${value} phút trước`:'Đúng giờ bắt đầu'}</option>)}</select></label>
        <label>Giờ nhắc việc/lịch cả ngày<input type="time" value={rule.allDayTime} onChange={event=>changeRule({allDayTime:event.target.value})}/></label>
        <label>Hoặc hẹn một giờ riêng<input type="datetime-local" value={rule.customAt} onChange={event=>changeRule({customAt:event.target.value})}/><small>Để trống để dùng giờ bắt đầu; lịch lặp nhắc từng lần, việc cả ngày nhắc mỗi ngày còn đang làm. Giờ riêng chỉ nhắc một lần.</small></label>
      </fieldset>}
      <p>Hoàn thành hoặc xóa việc sẽ hủy các nhắc còn chờ của mục đó. Dữ liệu trên thiết bị cập nhật khi mở app và đồng bộ nền theo lịch Android.</p>
      <div className="android-permissions"><span>Thông báo: {status?.notifications?'Đã cho phép':'Chưa cho phép'}</span><button className="text-btn" disabled={busy} onClick={()=>action(async()=>{await PlannerAndroid.requestNotifications();await reload();})}>Cho phép thông báo</button><span>Nhắc đúng giờ: {status?.exactAlarms?'Đã cho phép':'Có thể bị trễ'}</span><button className="text-btn" disabled={busy} onClick={()=>action(()=>PlannerAndroid.openExactAlarmSettings())}>Cài đặt nhắc đúng giờ</button><button className="text-btn" disabled={busy} onClick={()=>action(()=>PlannerAndroid.openNotificationSettings())}>Cài đặt màn hình khóa</button></div>
      <button className="primary-btn" disabled={busy} onClick={()=>action(save)}>{busy?'Đang lưu…':'Lưu cài đặt'}</button>
    </>}{error&&<p role="alert" className="error-message">{error}</p>}{message&&<p role="status">{message}</p>}
  </section></div>;
}
