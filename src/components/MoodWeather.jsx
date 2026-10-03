import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { dateKey } from '../lib/date';
import { findMood, moodOptions, moodStyle, moodCalendarCells, monthlyMoodStats } from '../lib/mood';
import useMoodJournal from '../lib/useMoodJournal';

function MoodChoices({ value, disabled, onChoose }) {
  return <div className="mood-choices">{moodOptions.map(option => <button type="button" key={option.id} className={`mood-choice ${value === option.id ? 'selected' : ''}`} style={moodStyle(option)} aria-pressed={value === option.id} disabled={disabled} onClick={() => onChoose(option.id)} title={option.description}><span>{option.emoji}</span>{option.label}</button>)}</div>;
}

export default function MoodWeather({ user, demo }) {
  const { entries, ready, busy, error, save } = useMoodJournal(user, demo);
  const today = dateKey(new Date());
  const [open, setOpen] = useState(false), [selected, setSelected] = useState(today), [month, setMonth] = useState(new Date());
  const [note, setNote] = useState(''), [message, setMessage] = useState('');
  const trigger = useRef(null);
  const panel = useRef(null), saving = useRef(busy);
  saving.current = busy;
  const todayEntry = entries[today], current = findMood(todayEntry?.moodId) || findMood('cloudy');
  const selectedEntry = entries[selected], selectedMood = findMood(selectedEntry?.moodId) || findMood('cloudy');
  const stats = monthlyMoodStats(entries, month), total = stats.reduce((sum, mood) => sum + mood.count, 0);
  const top = [...stats].sort((a, b) => b.count - a.count)[0];
  const disabled = busy || !ready;
  function show() { setSelected(today); setMonth(new Date(`${today}T12:00:00`)); setNote(entries[today]?.note || ''); setMessage(''); setOpen(true); }
  function close() { if (busy) return; setOpen(false); trigger.current?.focus(); }
  function chooseDate(date) { setSelected(date); setNote(entries[date]?.note || ''); setMessage(''); }
  async function saveSelected(moodId = selectedEntry?.moodId || 'cloudy') {
    setMessage('');
    if (await save(selected, moodId, note)) setMessage('Đã lưu cảm xúc và ghi chú.');
  }
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    const handleKeys = event => {
      if (event.key === 'Escape' && !saving.current) { setOpen(false); trigger.current?.focus(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.current?.querySelectorAll('button:not(:disabled), textarea:not(:disabled), a[href]') || []);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKeys);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeys); };
  }, [open]);

  return <>
    <section className="mood-weather" style={moodStyle(current)} aria-label="Thời tiết cảm xúc hôm nay">
      <button className="mood-summary" type="button" ref={trigger} onClick={show} aria-label="Mở lịch cảm xúc"><span className="mood-symbol">{todayEntry ? current.emoji : '⛅'}</span><span className="mood-copy"><span className="eyebrow">MOOD WEATHER</span><strong>Thời tiết cảm xúc hôm nay</strong><b>{todayEntry ? `${current.title} · ${current.label}` : 'Hôm nay bạn cảm thấy thế nào?'}</b><span>{todayEntry ? current.description : 'Chọn một biểu tượng để ghi nhận cảm xúc và nhịp làm việc của bạn.'}</span>{todayEntry?.note && <em>“{todayEntry.note}”</em>}</span></button>
      <div className="mood-quick"><span className="eyebrow">CHỌN NHANH HÔM NAY</span><MoodChoices value={todayEntry?.moodId} disabled={disabled} onChoose={id => save(today, id)}/><button type="button" className="text-btn" onClick={show}><CalendarDays size={14}/>Lịch cảm xúc theo tháng</button><span className="mood-save-state" role="status">{!ready ? 'Đang tải cảm xúc…' : busy ? 'Đang lưu…' : todayEntry ? demo ? 'Đã ghi nhận trong bản demo' : 'Đã lưu vào tài khoản' : ''}</span></div>
      {error && <p className="error-message mood-error" role="alert">{error}</p>}
    </section>
    {open && <div className="modal-backdrop mood-backdrop" onClick={close}><section className="mood-panel" ref={panel} role="dialog" aria-modal="true" aria-label="Lịch tâm trạng theo tháng" onClick={e => e.stopPropagation()}>
      <header className="mood-panel-head"><div><span className="eyebrow">MOOD CALENDAR</span><h2>Lịch tâm trạng theo tháng</h2><p>Nhìn lại nhịp làm việc, học tập và nghỉ ngơi của bạn.</p></div><button type="button" className="icon-btn" aria-label="Đóng lịch cảm xúc" onClick={close} disabled={busy}><X size={20}/></button></header>
      <div className="mood-panel-body"><div className="mood-month"><div className="mood-month-nav"><button type="button" className="icon-btn" aria-label="Tháng cảm xúc trước" disabled={busy} onClick={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft size={18}/></button><div><h3>{month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h3><span>{total} ngày đã ghi nhận</span></div><button type="button" className="icon-btn" aria-label="Tháng cảm xúc sau" disabled={busy} onClick={() => setMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight size={18}/></button></div>
        <div className="mood-calendar">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span className="mood-weekday" key={day}>{day}</span>)}{moodCalendarCells(month).map((date, i) => date ? <button type="button" key={date} className={`mood-day ${selected === date ? 'selected' : ''} ${date === today ? 'today' : ''}`} disabled={busy} aria-label={`Cảm xúc ngày ${date}${entries[date] ? `: ${findMood(entries[date].moodId)?.label}` : ': chưa ghi nhận'}`} aria-pressed={selected === date} onClick={() => chooseDate(date)}><time dateTime={date}>{Number(date.slice(-2))}</time><span>{findMood(entries[date]?.moodId)?.emoji || '·'}</span>{entries[date]?.note && <i/>}</button> : <span className="mood-blank" key={`blank-${i}`}/>)}</div>
      </div><div className="mood-edit-column"><section className="mood-editor" style={moodStyle(selectedMood)}><div className="mood-editor-title"><span className="mood-symbol">{selectedEntry ? selectedMood.emoji : '✍️'}</span><div><time dateTime={selected}>{selected.split('-').reverse().join('/')}</time><h3>{selectedEntry ? selectedMood.title : 'Chưa ghi nhận'}</h3><span>{selectedEntry ? selectedMood.label : 'Chọn cảm xúc cho ngày này'}</span></div></div><MoodChoices value={selectedEntry?.moodId} disabled={disabled} onChoose={id => saveSelected(id)}/><label className="mood-note-label">Ghi chú ngắn<textarea maxLength={4000} value={note} onChange={e => { setNote(e.target.value); setMessage(''); }} placeholder="Hôm nay học khá tốt, hơi mệt buổi tối…" disabled={busy}/></label><div className="mood-note-actions"><button type="button" className="primary-btn" onClick={() => saveSelected()} disabled={disabled}>{busy ? 'Đang lưu…' : 'Lưu ghi chú'}</button><span role="status">{message}</span></div>{error && <p className="error-message" role="alert">{error}</p>}</section>
      <section className="mood-stats"><h3>Tổng quan tháng</h3>{stats.map(stat => <div key={stat.id}><span>{stat.emoji} {stat.label}</span><b style={moodStyle(stat)}>{stat.count} ngày</b></div>)}<p>{total ? <>Cảm xúc được ghi nhận nhiều nhất: <strong>{top.emoji} {top.label}</strong>.</> : 'Chưa có dữ liệu trong tháng này. Chọn một ngày để bắt đầu ghi nhận.'}</p></section></div></div>
    </section></div>}
  </>;
}
