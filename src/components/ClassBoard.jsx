import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, ExternalLink, RefreshCw, X } from 'lucide-react';
import { fetchClassFeed } from '../lib/supabase';
import { dateKey, fmtShort } from '../lib/date';

export default function ClassBoard({ days, onClose }) {
  const [feed, setFeed] = useState({ items: [], groups: [], warning: '' });
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [group, setGroup] = useState('common'), [kind, setKind] = useState('all'), [scope, setScope] = useState('week');
  const [selected, setSelected] = useState(null), [loadedAt, setLoadedAt] = useState(null);
  const active = useRef(null), mounted = useRef(false);
  const board = useRef(null);
  async function refresh() {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    const timer = setTimeout(() => controller.abort('timeout'), 20000);
    setLoading(true); setError('');
    try {
      const next = await fetchClassFeed(controller.signal);
      if (mounted.current && active.current === controller) { setFeed(next); setLoadedAt(new Date()); }
    } catch (err) {
      if (mounted.current && active.current === controller) setError(controller.signal.aborted ? 'Tải lịch lớp quá lâu. Hãy kiểm tra mạng và thử lại.' : err.message || 'Không tải được lịch lớp. Hãy thử lại.');
    } finally {
      clearTimeout(timer);
      if (mounted.current && active.current === controller) setLoading(false);
    }
  }
  useEffect(() => { mounted.current = true; board.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); refresh(); return () => { mounted.current = false; active.current?.abort(); }; }, []);
  const first = dateKey(days[0]), last = dateKey(days[days.length - 1]);
  const filtered = useMemo(() => feed.items.filter(item => (group === 'all' || (group === 'common' ? !item.groupId : item.groupId === group)) && (kind === 'all' || item.kind === kind)), [feed, group, kind]);
  const weekItems = filtered.filter(item => item.date >= first && item.date <= last);
  const tasks = filtered.filter(item => item.kind === 'task' && (scope === 'all' || (scope === 'upcoming' ? item.date >= dateKey(new Date()) : item.date >= first && item.date <= last)));
  const name = item => feed.groups.find(g => g.id === item.groupId)?.name || (item.groupId ? 'Nhóm lớp' : 'Chung của lớp');
  const groups = feed.groups.filter(g => feed.items.some(item => item.groupId === g.id));

  return <section className="class-board" ref={board} aria-label="Lịch và công việc của lớp">
    <div className="section-head"><div><span className="eyebrow">NGUỒN LỚP · SUPABASE</span><h2>Lịch & công việc của lớp</h2></div><div className="class-actions"><button className="text-btn" disabled={loading} onClick={refresh}><RefreshCw size={15} className={loading ? 'spin' : ''}/>{loading ? 'Đang tải…' : 'Làm mới'}</button><button className="icon-btn" aria-label="Ẩn lịch lớp" onClick={onClose}><X size={18}/></button></div></div>
    <p className="class-intro">Xem dữ liệu chung từ lớp. Lịch có ngày cụ thể, công việc có ngày đến hạn.</p>
    <div className="class-filters"><label>Nhóm<select value={group} onChange={e => setGroup(e.target.value)}><option value="common">Chung của lớp</option><option value="all">Tất cả nhóm công khai</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label><label>Hiển thị<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">Lịch và công việc</option><option value="event">Chỉ lịch</option><option value="task">Chỉ công việc</option></select></label><span className="class-sync" role="status">{loading ? 'Đang đọc nguồn lớp…' : loadedAt ? `Đã cập nhật ${loadedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${filtered.length} mục` : ''}</span></div>
    {error && <p className="error-message" role="alert">{error}{loadedAt ? ' Dữ liệu bên dưới là lần tải thành công trước đó.' : ''}</p>}
    {feed.warning && <p className="notice">{feed.warning}</p>}
    <div className="class-week">{days.map(day => { const key = dateKey(day); return <div className="class-day" key={key}><header><b>{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</b><span>{fmtShort(day)}</span></header>{weekItems.filter(item => item.date === key).map(item => <button className="class-item" key={item.id} onClick={() => setSelected(item)}><i style={{ background: item.kind === 'task' ? '#e8d8f4' : '#d9efdf' }}>{item.kind === 'task' ? <CheckCircle2 size={14}/> : <CalendarDays size={14}/>}</i><span>{item.title}<small>{item.kind === 'task' ? 'Đến hạn' : 'Lịch'} · {name(item)}</small></span></button>)}</div>; })}</div>
    {!loading && !weekItems.length && <p className="empty-state">Không có mục nào từ nguồn lớp trong tuần {fmtShort(days[0])}–{fmtShort(days[days.length - 1])}. {kind === 'event' ? 'Bạn có thể đổi tuần hoặc nhóm.' : 'Bạn có thể đổi tuần hoặc xem các deadline bên dưới.'}</p>}
    {kind !== 'event' && <div className="class-task-list"><div className="class-list-head"><h3>Deadline của lớp</h3><label>Khoảng thời gian<select value={scope} onChange={e => setScope(e.target.value)}><option value="week">Tuần đang xem</option><option value="upcoming">Từ hôm nay</option><option value="all">Tất cả ngày</option></select></label></div>{tasks.map(item => <button className="class-task" key={item.id} onClick={() => setSelected(item)}><time dateTime={item.date}>{item.date.split('-').reverse().join('/')}</time><span><b>{item.title}</b><small>{name(item)}{item.assignee ? ` · ${item.assignee}` : ''}</small></span><ExternalLink size={14}/></button>)}{!loading && !tasks.length && <p className="empty-state">Không có deadline trong khoảng thời gian đã chọn.</p>}</div>}
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="modal class-detail" role="dialog" aria-modal="true" aria-label="Chi tiết từ lớp" onClick={e => e.stopPropagation()}><button className="icon-btn close" aria-label="Đóng chi tiết lớp" onClick={() => setSelected(null)}><X size={20}/></button><span className="eyebrow">{selected.kind === 'task' ? 'CÔNG VIỆC LỚP' : 'LỊCH LỚP'} · CHỈ XEM</span><h2>{selected.title}</h2><p>{selected.kind === 'task' ? 'Đến hạn' : 'Ngày'}: {selected.date.split('-').reverse().join('/')}</p><p>{name(selected)}{selected.assignee ? ` · ${selected.assignee}` : ''}</p>{selected.link && <a className="primary-btn class-resource" href={selected.link} target="_blank" rel="noopener noreferrer">Mở tài liệu <ExternalLink size={15}/></a>}<small>Dữ liệu được quản lý tại nguồn lớp.</small></section></div>}
  </section>;
}
