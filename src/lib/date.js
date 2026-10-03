export const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export function startOfMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

export function weekDays(baseDate) {
  const monday = startOfMonday(baseDate);
  return Array.from({length: 6}, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export const fmtShort = (d) => `${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
export const fmtFull = (d) => d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

export function intersectsDay(start, end, day) {
  const a = new Date(start); const b = new Date(end);
  const ds = new Date(day); ds.setHours(0,0,0,0);
  const de = new Date(ds); de.setDate(de.getDate()+1);
  return a < de && b > ds;
}

export function clipToWeek(start, end, days) {
  const ws = new Date(days[0]); ws.setHours(0,0,0,0);
  const we = new Date(days[5]); we.setHours(23,59,59,999);
  const s = new Date(start); const e = new Date(end);
  if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()) || e < s) return null;
  if (e < ws || s > we) return null;
  const clippedS = s < ws ? ws : s;
  const clippedE = e > we ? we : e;
  const startIndex = Math.max(0, Math.floor((new Date(clippedS.getFullYear(), clippedS.getMonth(), clippedS.getDate()) - ws) / 86400000));
  const endIndex = Math.min(5, Math.floor((new Date(clippedE.getFullYear(), clippedE.getMonth(), clippedE.getDate()) - ws) / 86400000));
  return { startIndex, endIndex };
}
