export const defaultAndroidSettings={summaryEnabled:false,showTitles:true,remindersEnabled:true,reminders:{}};
export const soundOptions=[['ringtone','Chuông điện thoại mặc định'],['notification','Âm thông báo mặc định'],['alarm','Chuông báo thức mặc định'],['silent','Chỉ hiện thông báo, không phát chuông']];
export const newReminderRule={enabled:false,minutesBefore:15,leadUnit:'minutes',anchor:'start',allDayTime:'09:00',allDayLead:true,customAt:'',soundMode:'ringtone'};
export function normalizeReminderRule(raw,allDay=false){
  if(!raw)return {...newReminderRule};
  return {...newReminderRule,...raw,anchor:raw.anchor==='end'?'end':'start',soundMode:soundOptions.some(([mode])=>mode===raw.soundMode)?raw.soundMode:'notification',leadUnit:raw.leadUnit==='hours'?'hours':'minutes',minutesBefore:allDay&&raw.allDayLead!==true?0:raw.minutesBefore??15,allDayLead:true};
}
export function leadInMinutes(amount,unit){
  if(amount===''||amount===null||amount===undefined)return null;
  return Number(amount)*(unit==='hours'?60:1);
}
export function validateReminderSettings(settings,baseline={},now=Date.now()){
  if(settings.remindersEnabled===false)return settings;
  for(const [key,rule] of Object.entries(settings.reminders || {})){
    if(!rule.enabled)continue;
    if(!Number.isInteger(rule.minutesBefore)||rule.minutesBefore<0||rule.minutesBefore>10080)throw new Error('Chọn số phút hoặc giờ hợp lệ, tối đa 7 ngày; mốc nhắc phải quy đổi thành số phút nguyên.');
    if(!['start','end'].includes(rule.anchor || 'start'))throw new Error('Chọn mốc bắt đầu hoặc kết thúc.');
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(rule.allDayTime || '09:00'))throw new Error('Chọn giờ mốc hợp lệ cho mục cả ngày.');
    if(rule.customAt){
      const time=new Date(rule.customAt).getTime(),old=baseline.reminders?.[key];
      if(!Number.isFinite(time))throw new Error('Giờ hẹn riêng không hợp lệ.');
      if(time<=now&&!(old?.enabled&&old.customAt===rule.customAt))throw new Error('Chọn giờ hẹn riêng trong tương lai.');
    }
  }
  return settings;
}
