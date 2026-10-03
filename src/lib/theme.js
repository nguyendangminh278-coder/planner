// Palette transferred from todolist-main's weekday columns and category chips.
export const dayPalette = [
  { background: '#fff1f2', header: '#ffe4e6', border: '#fecdd3', ink: '#be123c' },
  { background: '#fff7ed', header: '#ffedd5', border: '#fed7aa', ink: '#c2410c' },
  { background: '#fffbeb', header: '#fef3c7', border: '#fde68a', ink: '#b45309' },
  { background: '#ecfdf5', header: '#d1fae5', border: '#a7f3d0', ink: '#047857' },
  { background: '#ecfeff', header: '#cffafe', border: '#a5f3fc', ink: '#0e7490' },
  { background: '#eef2ff', header: '#e0e7ff', border: '#c7d2fe', ink: '#4338ca' },
  { background: '#faf5ff', header: '#f3e8ff', border: '#e9d5ff', ink: '#7e22ce' },
];

export const plannerColors = [
  { name: 'Công việc chính', value: '#ffe4e6', ink: '#be123c' },
  { name: 'Học trên lớp', value: '#e0e7ff', ink: '#4338ca' },
  { name: 'Học cá nhân', value: '#cffafe', ink: '#0e7490' },
  { name: 'Công việc cá nhân', value: '#d1fae5', ink: '#047857' },
  { name: 'Kế hoạch khác', value: '#fef3c7', ink: '#b45309' },
  { name: 'Sáng tạo', value: '#f3e8ff', ink: '#7e22ce' },
];

export function dayStyle(index) {
  const color = dayPalette[index % dayPalette.length];
  return { '--day-bg': color.background, '--day-header': color.header, '--day-border': color.border, '--day-ink': color.ink };
}
