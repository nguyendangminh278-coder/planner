import {useEffect,useRef,useState} from 'react';
import {App as NativeApp} from '@capacitor/app';
import {X,Bell,Smartphone} from 'lucide-react';
import {PlannerAndroid,isAndroid} from '../lib/android';
import {reminderCatalog} from '../lib/mobileAgenda';
import {defaultAndroidSettings,normalizeReminderRule,leadInMinutes,validateReminderSettings,soundOptions} from '../lib/reminderSettings';

export default function AndroidSettings({events,tasks,onClose,onUpdate,bridge=PlannerAndroid}) {
  const [settings,setSettings]=useState(null),[status,setStatus]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[key,setKey]=useState('');
  const baseline=useRef({}),catalog=reminderCatalog(events,tasks),selected=catalog.find(item=>item.key===key),rule=normalizeReminderRule(settings?.reminders?.[key],selected?.allDay);
  async function reload(){const result=await bridge.getSettings();const value={...defaultAndroidSettings,...result.settings};baseline.current=value;setSettings(value);setStatus(result.status);return result;}
  useEffect(()=>{let active=true;reload().catch(()=>{if(active)setError('Không đọc được cài đặt Android.');});return()=>{active=false;};},[]);
  useEffect(()=>{
    if(!isAndroid)return;
    const listener=NativeApp.addListener('appStateChange',state=>{if(state.isActive)bridge.getSettings().then(result=>setStatus(result.status)).catch(()=>{});});
    return()=>{listener.then(handle=>handle.remove());};
  },[bridge]);
  const changeRule=patch=>setSettings(current=>({...current,reminders:{...current.reminders,[key]:{...normalizeReminderRule(current.reminders[key],selected?.allDay),...patch}}}));
  async function action(fn){setBusy(true);setError('');setMessage('');try{await fn();}catch(err){setError(err.message || 'Không thực hiện được.');}finally{setBusy(false);}}
  async function save(){
    validateReminderSettings(settings,baseline.current);await bridge.updateSettings({settings});onUpdate();
    const needsPermission=settings.summaryEnabled || settings.remindersEnabled&&Object.values(settings.reminders).some(item=>item.enabled);
    if(needsPermission&&!status?.notifications)await bridge.requestNotifications();
    const result=await reload();
    setMessage(needsPermission&&!result.status?.notifications?'Đã lưu cài đặt. Cần cho phép thông báo để điện thoại hiện nhắc và phát chuông.':settings.remindersEnabled?'Đã lưu giờ nhắc và lựa chọn chuông trên điện thoại này.':'Đã tắt nhắc lịch và công việc trên điện thoại này.');
  }
  return <div className="modal-backdrop" onClick={()=>!busy&&onClose()}><section className="modal android-settings" role="dialog" aria-modal="true" aria-label="Widget & nhắc việc" onClick={event=>event.stopPropagation()}>
    <button className="icon-btn close" aria-label="Đóng" disabled={busy} onClick={onClose}><X size={20}/></button><span className="eyebrow">PLANNER ANDROID</span><h2><Smartphone size={23}/>Widget & nhắc việc</h2>
    {!settings?<p role="status">Đang đọc cài đặt…</p>:<>
      <h3>Hai tiện ích riêng trên màn hình</h3><p><b>Công việc:</b> tên việc, nội dung ngắn và ô tick hoàn thành. <b>Lịch theo giờ:</b> lưới 3 ngày, hôm nay ở giữa; có nút chuyển ngày để xem lịch tới. Nhấn giữ màn hình chính → Widgets → Planner để thêm.</p>
      <div className="two"><button type="button" className="soft-btn" disabled={busy} onClick={()=>action(()=>bridge.pinWidget({kind:'tasks'}))}>Thêm widget Công việc</button><button type="button" className="soft-btn" disabled={busy} onClick={()=>action(()=>bridge.pinWidget({kind:'calendar'}))}>Thêm widget Lịch theo giờ</button></div>
      <label className="android-toggle"><input type="checkbox" checked={settings.summaryEnabled} onChange={event=>setSettings(current=>({...current,summaryEnabled:event.target.checked}))}/>Hiện bảng hôm nay bằng thông báo trên màn hình khóa</label>
      <label className="android-toggle"><input type="checkbox" checked={settings.showTitles} onChange={event=>setSettings(current=>({...current,showTitles:event.target.checked}))}/>Cho phép hiện tên lịch/việc trên widget và màn hình khóa</label>
      <small>Widget khóa chỉ có trong bộ chọn widget khi Nothing OS hỗ trợ. Thông báo khóa phụ thuộc cài đặt thông báo của điện thoại. Khi tắt hiện tên, màn hình khóa chỉ hiện số lượng việc.</small>
      <h3><Bell size={18}/>Nhắc lịch / công việc bằng chuông</h3>
      <label className="android-toggle"><input type="checkbox" checked={settings.remindersEnabled} onChange={event=>setSettings(current=>({...current,remindersEnabled:event.target.checked}))}/>Bật nhắc lịch và task trên điện thoại</label>
      {!settings.remindersEnabled&&<p className="notice">Nhắc việc đang tắt. Bạn vẫn có thể chọn giờ và chuông bên dưới; bật lại rồi lưu để sử dụng.</p>}
      <label>Chọn lịch, việc hoặc bước<select value={key} onChange={event=>setKey(event.target.value)}><option value="">Chọn một mục…</option>{catalog.map(item=><option key={item.key} value={item.key}>{item.kind}: {item.title}{item.completed?' · Đã hoàn thành':''}</option>)}</select></label>
      {key&&<fieldset disabled={busy}>
        <label className="android-toggle"><input type="checkbox" checked={rule.enabled} onChange={event=>changeRule({enabled:event.target.checked})}/>Có thông báo nhắc cho mục này</label>
        <label>Mốc cần nhắc<select value={rule.anchor} onChange={event=>changeRule({anchor:event.target.value})}><option value="start">{selected?.allDay?'Ngày bắt đầu / mỗi ngày đang làm':'Trước giờ bắt đầu'}</option><option value="end">{selected?.allDay?'Ngày kết thúc / hạn cuối':'Trước giờ kết thúc / hạn hoàn thành'}</option></select></label>
        <div className="two reminder-lead"><label>Nhắc trước bao lâu<input aria-label="Số phút hoặc giờ nhắc trước" type="number" min="0" max={rule.leadUnit==='hours'?168:10080} step={rule.leadUnit==='hours'?0.25:1} value={rule.minutesBefore===null?'':rule.minutesBefore/(rule.leadUnit==='hours'?60:1)} onChange={event=>changeRule({minutesBefore:leadInMinutes(event.target.value,rule.leadUnit)})}/></label><label>Đơn vị<select value={rule.leadUnit} onChange={event=>changeRule({leadUnit:event.target.value})}><option value="minutes">Phút</option><option value="hours">Giờ</option></select></label></div>
        <small>Ví dụ: bắt đầu 15:00, chọn trước 2 giờ → nhắc lúc 13:00. Việc đã bắt đầu có thể chọn nhắc trước giờ kết thúc.</small>
        {selected?.allDay&&<label>Giờ mốc cho mục cả ngày<input type="time" value={rule.allDayTime} onChange={event=>changeRule({allDayTime:event.target.value})}/><small>Áp dụng khoảng nhắc trước vào giờ mốc này. Việc cả ngày đang làm nhắc mỗi ngày; chọn hạn cuối để chỉ nhắc ngày kết thúc.</small></label>}
        <label>Chuông cảnh báo<select value={rule.soundMode} onChange={event=>changeRule({soundMode:event.target.value})}>{soundOptions.map(([mode,label])=><option key={mode} value={mode}>{label}</option>)}</select></label>
        {rule.soundMode!=='silent'&&<button type="button" className="text-btn" onClick={()=>action(()=>bridge.openReminderSoundSettings({soundMode:rule.soundMode}))}>Chọn âm chuông trên điện thoại</button>}
        <small>Âm chuông hệ thống áp dụng cho các mục cùng kiểu chuông. Âm lượng, chế độ im lặng và Không làm phiền có thể ảnh hưởng tiếng cảnh báo.</small>
        <label>Hoặc hẹn một giờ riêng<input type="datetime-local" value={rule.customAt} onChange={event=>changeRule({customAt:event.target.value})}/><small>Giờ riêng nhắc một lần và thay cho mốc/độ lệch bên trên. Để trống để dùng giờ của lịch/task.</small></label>
        {selected?.completed&&<p className="notice">Mục đã hoàn thành sẽ không phát nhắc. Mở lại công việc để sử dụng giờ nhắc đã lưu.</p>}
        <button type="button" className="soft-btn" disabled={!settings.remindersEnabled} onClick={()=>action(async()=>{const result=await bridge.testReminder({soundMode:rule.soundMode});setMessage(result.exact?'Đã hẹn thông báo thử sau 10 giây.':'Đã hẹn thử sau 10 giây; Android có thể phát muộn khi chưa cho phép nhắc đúng giờ.');})}>Thử thông báo và chuông sau 10 giây</button>
      </fieldset>}
      <p>Hoàn thành hoặc xóa việc sẽ hủy các nhắc còn chờ của mục đó. Cài đặt nhắc lưu riêng trên điện thoại này.</p>
      <div className="android-permissions"><span>Thông báo: {status?.notifications?'Đã cho phép':'Chưa cho phép'}</span><button className="text-btn" disabled={busy} onClick={()=>action(async()=>{await bridge.requestNotifications();const result=await bridge.getSettings();setStatus(result.status);})}>Cho phép thông báo</button><span>Nhắc đúng giờ: {status?.exactAlarms?'Đã cho phép':'Có thể bị trễ'}</span><button className="text-btn" disabled={busy} onClick={()=>action(()=>bridge.openExactAlarmSettings())}>Cài đặt nhắc đúng giờ</button><button className="text-btn" disabled={busy} onClick={()=>action(()=>bridge.openNotificationSettings())}>Cài đặt màn hình khóa</button></div>
      <button className="primary-btn" disabled={busy} onClick={()=>action(save)}>{busy?'Đang lưu…':'Lưu cài đặt'}</button>
    </>}{error&&<p role="alert" className="error-message">{error}</p>}{message&&<p role="status">{message}</p>}
  </section></div>;
}
