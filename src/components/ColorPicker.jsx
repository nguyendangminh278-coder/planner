import { plannerColors } from '../lib/theme';

export default function ColorPicker({ value, onChange }) {
  return <fieldset className="color-picker"><legend>Màu hiển thị</legend><div>{plannerColors.map(color => <button type="button" key={color.value} className={value === color.value ? 'selected' : ''} style={{ background: color.value, color: color.ink }} aria-label={`Màu ${color.name}`} aria-pressed={value === color.value} title={color.name} onClick={() => onChange(color.value)}><i/>{color.name}</button>)}</div></fieldset>;
}
