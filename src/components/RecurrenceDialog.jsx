import { useState } from 'react';
import { DateTime } from 'luxon';
import { defaultRecurrence, validRecurrence, weekdayChips, weekdayNames, monthlyWeekdayLabel } from '../lib/recurrence';

export default function RecurrenceDialog({ date, value, onCancel, onDone }) {
  const [draft, setDraft] = useState(value || defaultRecurrence(date));
  const [until, setUntil] = useState(value?.untilDate || DateTime.fromISO(date).plus({ months: 3 }).toISODate());
  const [count, setCount] = useState(value?.count || 13), [error, setError] = useState('');
  const change = (key, val) => { setDraft(current => ({ ...current, [key]: val })); setError(''); };
  const anchor = DateTime.fromISO(date);
  function done() {
    const next = { ...draft, interval: Number(draft.interval), weekdays: draft.frequency === 'weekly' ? [...draft.weekdays].sort((a,b) => a-b) : [], untilDate: draft.endType === 'until' ? until : null, count: draft.endType === 'count' ? Number(count) : null };
    if (!validRecurrence(next, date)) return setError('Chọn khoảng lặp từ 1–99, ít nhất một thứ nếu lặp tuần, và thời điểm kết thúc hợp lệ. Số lần từ 1–1.000.');
    onDone(next);
  }
  return <div className="recurrence-backdrop" onClick={event => { event.stopPropagation(); onCancel(); }}><section className="recurrence-dialog" role="dialog" aria-modal="true" aria-label="Lặp lại tùy chỉnh" onClick={event => event.stopPropagation()}>
    <h3>Lặp lại tùy chỉnh</h3><div className="recurrence-interval"><label>Lặp lại mỗi<input aria-label="Khoảng lặp" type="number" min={1} max={99} value={draft.interval} onInput={event => change('interval', event.target.value)}/></label><select aria-label="Đơn vị lặp" value={draft.frequency} onChange={event => { const frequency = event.target.value; setDraft(current => ({ ...current, frequency, weekdays: frequency === 'weekly' && !current.weekdays.length ? [anchor.weekday] : current.weekdays })); }}><option value="daily">ngày</option><option value="weekly">tuần</option><option value="monthly">tháng</option><option value="yearly">năm</option></select></div>
    {draft.frequency === 'weekly' && <fieldset className="recurrence-weekdays"><legend>Lặp lại vào</legend><div>{weekdayChips.map((label,index) => <button type="button" key={label} aria-label={`Lặp vào ${weekdayNames[index]}`} aria-pressed={draft.weekdays.includes(index+1)} className={draft.weekdays.includes(index+1) ? 'selected' : ''} onClick={() => change('weekdays', draft.weekdays.includes(index+1) ? draft.weekdays.filter(day => day !== index+1) : [...draft.weekdays,index+1])}>{label}</button>)}</div></fieldset>}
    {draft.frequency === 'monthly' && <label className="recurrence-month-mode">Lặp theo<select aria-label="Kiểu lặp tháng" value={draft.monthlyMode} onChange={event => change('monthlyMode', event.target.value)}><option value="date">Ngày {anchor.day} hằng tháng</option><option value="weekday">{monthlyWeekdayLabel(date)} của tháng</option></select></label>}
    <fieldset className="recurrence-ending"><legend>Kết thúc</legend><label><input type="radio" name="recurrence-ending" checked={draft.endType === 'never'} onChange={() => change('endType','never')}/>Không bao giờ</label><div><label><input type="radio" name="recurrence-ending" checked={draft.endType === 'until'} onChange={() => change('endType','until')}/>Vào ngày</label><input aria-label="Ngày kết thúc lặp lại" type="date" min={date} max="9999-12-31" disabled={draft.endType !== 'until'} value={until} onInput={event => setUntil(event.target.value)} onChange={event => setUntil(event.target.value)}/></div><div><label><input type="radio" name="recurrence-ending" checked={draft.endType === 'count'} onChange={() => change('endType','count')}/>Sau</label><input aria-label="Số lần xuất hiện" type="number" min={1} max={1000} disabled={draft.endType !== 'count'} value={count} onInput={event => setCount(event.target.value)}/><span>lần xuất hiện</span></div></fieldset>
    {error && <p className="error-message" role="alert">{error}</p>}<div className="recurrence-actions"><button type="button" className="text-btn" onClick={onCancel}>Hủy</button><button type="button" className="primary-btn" onClick={done}>Xong</button></div>
  </section></div>;
}
