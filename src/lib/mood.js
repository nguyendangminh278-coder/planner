import { dateKey } from './date.js';

export const moodOptions = [
  { id: 'sunny', emoji: '☀️', title: 'Trời nắng', label: 'Rất ổn', description: 'Năng lượng cao, phù hợp xử lý việc khó.', background: 'linear-gradient(125deg,#fffbeb,#fff7ed,#fff)', chip: '#fef3c7', border: '#fde68a', ink: '#b45309' },
  { id: 'cloudy', emoji: '⛅', title: 'Có mây', label: 'Bình ổn', description: 'Tâm trạng ổn, nên giữ nhịp đều trong ngày.', background: 'linear-gradient(125deg,#f0f9ff,#f8fafc,#fff)', chip: '#e0f2fe', border: '#bae6fd', ink: '#0369a1' },
  { id: 'rainy', emoji: '🌧️', title: 'Mưa nhẹ', label: 'Hơi mệt', description: 'Nên giảm tải, chia nhỏ việc và nghỉ ngắn.', background: 'linear-gradient(125deg,#eff6ff,#ecfeff,#fff)', chip: '#dbeafe', border: '#bfdbfe', ink: '#1d4ed8' },
  { id: 'storm', emoji: '⛈️', title: 'Giông bão', label: 'Áp lực', description: 'Ưu tiên việc quan trọng nhất và bảo vệ năng lượng.', background: 'linear-gradient(125deg,#f5f3ff,#f1f5f9,#fff)', chip: '#ede9fe', border: '#ddd6fe', ink: '#6d28d9' },
  { id: 'rainbow', emoji: '🌈', title: 'Cầu vồng', label: 'Có cảm hứng', description: 'Phù hợp sáng tạo, học sâu hoặc làm project cá nhân.', background: 'linear-gradient(125deg,#fdf2f8,#fefce8,#ecfeff)', chip: '#fce7f3', border: '#fbcfe8', ink: '#be185d' },
  { id: 'fog', emoji: '🌫️', title: 'Sương mù', label: 'Mơ hồ', description: 'Cần viết ra điều đang vướng trước khi bắt đầu.', background: 'linear-gradient(125deg,#f8fafc,#fafafa,#fff)', chip: '#f1f5f9', border: '#e2e8f0', ink: '#334155' },
];

export const findMood = id => moodOptions.find(option => option.id === id);
export const moodStyle = mood => ({ '--mood-bg': mood.background, '--mood-chip': mood.chip, '--mood-border': mood.border, '--mood-ink': mood.ink });

export function validMoodEntry(date, moodId, note) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date && !!findMood(moodId) && typeof note === 'string' && note.length <= 4000;
}

export function moodCalendarCells(anchor) {
  const year = anchor.getFullYear(), month = anchor.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => index < offset || index >= offset + days ? null : dateKey(new Date(year, month, index - offset + 1)));
}

export function monthlyMoodStats(entries, anchor) {
  const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-`;
  return moodOptions.map(option => ({ ...option, count: Object.entries(entries).filter(([date, entry]) => date.startsWith(prefix) && entry.moodId === option.id && validMoodEntry(date, entry.moodId, entry.note || '')).length }));
}
