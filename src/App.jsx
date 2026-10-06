import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, LogOut, Users, RefreshCw, Share2, Plus, Droplets, List, Grid2X2, Layers } from 'lucide-react';
import Login from './components/Login';
import CalendarWeek from './components/CalendarWeek';
import TaskTimeline from './components/TaskTimeline';
import TaskDrawer from './components/TaskDrawer';
import AddEventModal from './components/AddEventModal';
import ShareModal from './components/ShareModal';
import MoodWeather from './components/MoodWeather';
import WeekAgenda from './components/WeekAgenda';
import SharedAvailability from './components/SharedAvailability';
import EventDetails from './components/EventDetails';
import { TaskList, PlanningSummary } from './components/TaskOverview';
import useSharedPlanner from './lib/useSharedPlanner';
import { expandEvents } from './lib/recurrence';
import { taskCompletionPatch } from './lib/taskActions';
import useClassTaskStates from './lib/useClassTaskStates';
import { weekDays, fmtShort, dateKey } from './lib/date';
import { demoEvents, demoTasks, demoUser } from './lib/mock';
import { auth, db, onAuthStateChanged, signOut, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, doc, serverTimestamp, firebaseError } from './lib/firebase';

function Avatar({ user }) { return user.photoURL ? <img className="avatar" src={user.photoURL} alt="Ảnh tài khoản" referrerPolicy="no-referrer"/> : <div className="avatar fallback">{(user.displayName || 'U').slice(0, 1)}</div>; }
const unpack = snapshot => snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
const ClassBoard = lazy(() => import('./components/ClassBoard'));
const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#e0e7ff';
const expandSafely = (rows, range) => { try { return { rows: expandEvents(rows,range.start,range.end), error: '' }; } catch (err) { return { rows: [], error: err.message }; } };

export default function App() {
  const [user, setUser] = useState(null), [authLoading, setAuthLoading] = useState(true), [demo, setDemo] = useState(false);
  const [week, setWeek] = useState(new Date());
  const [events, setEvents] = useState([]), [tasks, setTasks] = useState([]), [ownReady, setOwnReady] = useState(false);
  const [external, setExternal] = useState([]), [showExternal, setShowExternal] = useState(true);
  const [classOpen, setClassOpen] = useState(false), [calendarView, setCalendarView] = useState('agenda');
  const [includeSunday, setIncludeSunday] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('me'), [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState(null), [eventEditor, setEventEditor] = useState(null), [readEvent, setReadEvent] = useState(null), [shareOpen, setShareOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false), [dataLoading, setDataLoading] = useState(false), [error, setError] = useState('');
  const days = useMemo(() => weekDays(week,includeSunday), [week,includeSunday]);
  const range = useMemo(() => { const start = new Date(days[0]); start.setHours(0,0,0,0); const end = new Date(days[days.length-1]); end.setDate(end.getDate()+1); end.setHours(0,0,0,0); return { start, end }; }, [days]);
  const { owners, planner: peerPlanner, grantError } = useSharedPlanner(user, demo, selectedOwner);
  const peer = owners.find(owner => owner.ownerId === selectedOwner);
  const viewingShared = !!peer, viewOwner = viewingShared ? selectedOwner : 'me';
  const peerName = peer?.ownerName || '';
  const classTaskState = useClassTaskStates(user,demo,classOpen && !viewingShared);
  const ownOccurrences = useMemo(() => expandSafely(events,range), [events,range]);
  const peerOccurrences = useMemo(() => expandSafely(peerPlanner.events,range), [peerPlanner.events,range]);

  useEffect(() => onAuthStateChanged(auth, next => {
    setUser(next); setDemo(false); setEvents([]); setTasks([]); setExternal([]); setOwnReady(false); setSelectedOwner('me'); setCompare(false); setClassOpen(false); setError(''); setSelected(null); setEventEditor(null); setReadEvent(null); setShareOpen(false); setAuthLoading(false);
  }, err => { setError(firebaseError(err)); setAuthLoading(false); }), []);

  useEffect(() => {
    if (!user || demo) return;
    setDataLoading(true); setOwnReady(false);
    let active = true, failed = false, eventsReady = false, tasksReady = false;
    const onError = err => { failed = true; if (active) { setEvents([]); setTasks([]); setOwnReady(false); setError(firebaseError(err)); setDataLoading(false); } };
    const loaded = () => { if (eventsReady && tasksReady && !failed) { setDataLoading(false); setOwnReady(true); } };
    const stopEvents = onSnapshot(query(collection(db, 'events'), where('ownerId', '==', user.uid)), s => { if (!active || failed) return; setEvents(unpack(s)); eventsReady = true; loaded(); }, onError);
    const stopTasks = onSnapshot(query(collection(db, 'tasks'), where('ownerId', '==', user.uid)), s => { if (!active || failed) return; setTasks(unpack(s).sort((a, b) => a.start.localeCompare(b.start))); tasksReady = true; loaded(); }, onError);
    setDoc(doc(db, 'profiles', user.uid), { displayName: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '', updatedAt: serverTimestamp() }, { merge: true }).catch(err => { if (active) setError(firebaseError(err)); });
    return () => { active = false; stopEvents(); stopTasks(); };
  }, [user, demo]);

  useEffect(() => { if (selectedOwner !== 'me' && !peer) { setSelectedOwner('me'); setCompare(false); setSelected(null); setReadEvent(null); } }, [selectedOwner, peer]);

  function switchOwner(ownerId) {
    setSelectedOwner(ownerId); setCompare(false); setSelected(null); setEventEditor(null); setReadEvent(null);
  }
  function chooseTask(item) { setSelected({ ...item, viewerOwner: viewOwner }); }
  function chooseEvent(item) {
    if (viewingShared || item.source) setReadEvent({ id: item.id, viewerOwner: viewOwner });
    else setEventEditor(item.sourceEvent || events.find(event => event.id === (item.seriesId || item.id)) || item);
  }
  function newTask(initial = {}) { setSelected({ ...initial, viewerOwner: 'me' }); }
  function enterDemo() {
    setDemo(true); setWeek(new Date('2026-10-05T00:00:00+07:00')); setEvents(structuredClone(demoEvents)); setTasks(structuredClone(demoTasks)); setSelectedOwner('me'); setCompare(false); setExternal([]); setOwnReady(true); setDataLoading(false); setError('');
  }
  async function saveRecord(kind, data, id) {
    if (viewingShared) throw new Error('Read-only shared planner');
    if (kind === 'events' && (data.recurrence?.weekdays?.includes(7) || (new Date(data.start).getDay() === 0))) setIncludeSunday(true);
    if (demo) {
      const update = kind === 'events' ? setEvents : setTasks;
      update(rows => id ? rows.map(row => row.id === id ? { ...row, ...data } : row) : [...rows, { ...data, id: crypto.randomUUID(), owner: 'Bạn' }]);
      return;
    }
    if (!user) throw new Error('Not signed in');
    if (id) await updateDoc(doc(db, kind, id), { ...data, updatedAt: serverTimestamp() });
    else await addDoc(collection(db, kind), { ...data, ownerId: user.uid, owner: user.displayName || user.email, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  async function removeRecord(kind, id) {
    if (viewingShared) throw new Error('Read-only shared planner');
    if (demo) { (kind === 'events' ? setEvents : setTasks)(rows => rows.filter(row => row.id !== id)); return; }
    if (!user) throw new Error('Not signed in');
    await deleteDoc(doc(db, kind, id));
  }
  async function toggleTask(task) {
    const current = tasks.find(row => row.id === task.id);
    if (!current) throw new Error('Công việc không còn tồn tại.');
    await saveRecord('tasks',taskCompletionPatch(current),current.id);
  }
  async function logout() {
    try { if (demo) { setDemo(false); setEvents([]); setTasks([]); setExternal([]); setOwnReady(false); setSelectedOwner('me'); setCompare(false); setSelected(null); setReadEvent(null); setClassOpen(false); setError(''); } else await signOut(auth); }
    catch (err) { setError(firebaseError(err)); }
  }
  async function loadExternal() {
    const url = import.meta.env.VITE_GROUP_CALENDAR_API_URL;
    setError('');
    if (!url) {
      if (demo) setExternal([{ id: 'api1', title: 'Lịch nhóm: Sync sprint', start: '2026-10-07T15:00:00+07:00', end: '2026-10-07T16:00:00+07:00', color: '#d7f0ee', owner: 'Team Ops', source: 'external' }]);
      else setError('Chưa có nguồn lịch nhóm. Hãy cấu hình URL API lịch nhóm để sử dụng.');
      return;
    }
    setApiLoading(true);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('API error');
      const data = await response.json(), rows = Array.isArray(data) ? data : data.events;
      if (!Array.isArray(rows) || rows.some(e => !e.title || !Number.isFinite(Date.parse(e.start)) || !Number.isFinite(Date.parse(e.end)) || Date.parse(e.end) <= Date.parse(e.start))) throw new Error('Invalid response');
      setExternal(rows.map((e, i) => ({ ...e, id: `external:${e.id || i}`, source: 'external', color: color(e.color || '#d7f0ee') })));
    } catch { setError('Không tải được lịch nhóm. Hãy kiểm tra kết nối và định dạng dữ liệu API.'); }
    finally { setApiLoading(false); }
  }

  const activeUser = demo ? demoUser : user;
  const displayedTasks = viewingShared ? peerPlanner.tasks : tasks;
  const baseEvents = viewingShared ? peerOccurrences.rows.map(event => ({ ...event, id: `peer:${selectedOwner}:${event.id}`, source: 'shared', owner: peerName, color: compare ? '#e0e7ff' : color(event.color) })) : ownOccurrences.rows;
  const overlayEvents = viewingShared && compare ? ownOccurrences.rows.map(event => ({ ...event, id: `mine:${event.id}`, source: 'comparison-self', owner: 'Lịch của bạn', color: '#cffafe' })) : [];
  const visibleEvents = [...baseEvents, ...overlayEvents, ...(!viewingShared && showExternal ? external : [])];
  const selectedTask = selected?.viewerOwner === viewOwner ? viewingShared ? displayedTasks.find(task => task.id === selected.id) : selected : null;
  const selectedEvent = readEvent?.viewerOwner === viewOwner ? visibleEvents.find(event => event.id === readEvent.id) : null;
  const scopeError = (viewingShared ? peerPlanner.error || peerOccurrences.error : grantError || ownOccurrences.error) || (viewingShared && compare ? ownOccurrences.error : '');
  if (authLoading) return <div className="loading-screen" role="status">Đang mở Planner…</div>;
  if (!activeUser) return <Login onDemo={enterDemo}/>;
  return <div className="app-shell">
    <header className="topbar"><div className="logo"><span>p</span><b>Planner</b></div><div className="top-actions">
      {!viewingShared && <><button className="soft-btn" onClick={() => setEventEditor({})}><CalendarPlus size={16}/>Thêm lịch</button><button className="soft-btn" onClick={() => setShareOpen(true)}><Share2 size={16}/>Chia sẻ lịch & việc</button></>}
      <div className="profile"><Avatar user={activeUser}/><div><b>{activeUser.displayName}</b><small>{activeUser.email}</small></div><button className="icon-btn" aria-label="Đăng xuất" onClick={logout}><LogOut size={18}/></button></div>
    </div></header>
    <main>
      {demo && <div className="notice" role="status">Bản demo — thay đổi chỉ lưu trong phiên này. Đăng nhập Google để lưu dữ liệu thật.</div>}
      {(error || scopeError) && <div className="error-banner" role="alert">{scopeError || error}{!scopeError && <button className="text-btn" onClick={() => setError('')}>Đóng</button>}</div>}
      <section className="hero-strip"><div><span className="eyebrow">{viewingShared ? 'SHARED PLANNER · READ ONLY' : 'YOUR PERSONAL PLANNING SPACE'}</span><h1>{viewingShared ? `Planner của ${peerName}` : 'Planner'}</h1><p><Droplets size={18}/>{viewingShared ? 'Toàn bộ lịch & công việc được chia sẻ' : 'Flow of Knowledge'}<span className="hero-divider"/>{viewingShared ? 'Chỉ xem' : 'Lịch, công việc & nhịp sống của bạn'}</p></div>
        <div className="week-switch"><button className="icon-btn" aria-label="Tuần trước" onClick={() => setWeek(d => { const x = new Date(d); x.setDate(x.getDate() - 7); return x; })}><ChevronLeft/></button><div><b>{fmtShort(days[0])} — {fmtShort(days[days.length-1])}</b><small>{includeSunday ? 'Thứ 2 → Chủ nhật' : 'Thứ 2 → Thứ 7'} · {days[0].getFullYear()}</small></div><button className="icon-btn" aria-label="Tuần sau" onClick={() => setWeek(d => { const x = new Date(d); x.setDate(x.getDate() + 7); return x; })}><ChevronRight/></button></div>
      </section>
      <section className="planner-scope" aria-label="Chọn người xem lịch"><label>Xem lịch của<select value={viewOwner} onChange={e => switchOwner(e.target.value)}><option value="me">Tôi · {activeUser.displayName}</option>{owners.map(owner => <option key={owner.ownerId} value={owner.ownerId}>{owner.ownerName}</option>)}</select></label>
        {viewingShared ? <><label className="compare-toggle"><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}/><Layers size={16}/>Đối chiếu với lịch của tôi</label><button className="text-btn" onClick={() => switchOwner('me')}>Về lịch của tôi</button></> : <span>{owners.length ? `${owners.length} người đã chia sẻ lịch & công việc với bạn` : 'Người khác cần chia sẻ với email Google của bạn để xuất hiện ở đây.'}</span>}
      </section>
      {viewingShared && <p className="shared-view-note">Bạn đang xem riêng lịch và công việc của {peerName}. Chọn một công việc để xem đầy đủ các bước và ghi chú.</p>}
      <div hidden={viewingShared}><MoodWeather key={demo ? 'demo-moods' : user.uid} user={user} demo={demo}/></div>
      <div className="board-actions"><button className="soft-btn" onClick={() => setWeek(new Date())}>Tuần này</button>{!viewingShared && <><button className="soft-btn" onClick={() => setEventEditor({})}><CalendarPlus size={16}/>Thêm lịch</button><button className="soft-btn" onClick={() => newTask({ start: dateKey(days[0]), end: dateKey(days[days.length-1]) })}><Plus size={16}/>Thêm công việc</button><button className="soft-btn" onClick={() => setShareOpen(true)}><Share2 size={16}/>Chia sẻ lịch & việc</button><button className={`soft-btn ${classOpen ? 'active' : ''}`} aria-expanded={classOpen} onClick={() => setClassOpen(open => !open)}><Users size={16}/>{classOpen ? 'Ẩn lịch & task lớp' : 'Xem lịch & task lớp'}</button></>}<label className="sunday-toggle"><input type="checkbox" checked={includeSunday} onChange={event => setIncludeSunday(event.target.checked)}/>Hiện Chủ nhật</label></div>
      {(viewingShared ? peerPlanner.loading : dataLoading) && <p role="status">Đang tải lịch và công việc…</p>}
      {viewingShared && compare && <div className="comparison-legend"><span><i className="compare-mine"/>Lịch của bạn</span><span><i className="compare-peer"/>Lịch của {peerName}</span></div>}
      <section className="calendar-area"><div className="section-head"><div><span className="eyebrow">WEEKLY CALENDAR</span><h2><CalendarDays size={22}/>{viewingShared && compare ? 'Hai lịch cùng tuần' : 'Lịch trong tuần'}</h2></div><div className="calendar-view-switch" role="group" aria-label="Kiểu xem lịch"><button type="button" className={calendarView === 'agenda' ? 'active' : ''} aria-pressed={calendarView === 'agenda'} onClick={() => setCalendarView('agenda')}><List size={15}/>Theo ngày</button><button type="button" className={calendarView === 'grid' ? 'active' : ''} aria-pressed={calendarView === 'grid'} onClick={() => setCalendarView('grid')}><Grid2X2 size={15}/>Lưới giờ</button></div></div>
        {calendarView === 'agenda' ? <WeekAgenda days={days} events={visibleEvents} onSelect={chooseEvent} onAdd={viewingShared ? null : date => setEventEditor({ initialDate: date })}/> : <CalendarWeek days={days} events={visibleEvents} externalEvents={[]} showExternal={false} onSelect={chooseEvent} hideHeader comparison={viewingShared && compare}/>}
        {!viewingShared && <div className="api-ribbon"><div><Users size={15}/><b>Lịch nhóm API</b><span>Hiện cùng lịch của bạn</span></div><div><label className="switch"><input aria-label="Hiện lịch nhóm" type="checkbox" checked={showExternal} onChange={e => setShowExternal(e.target.checked)}/><i/></label><button className="text-btn" disabled={apiLoading} onClick={loadExternal}><RefreshCw size={14} className={apiLoading ? 'spin' : ''}/>{apiLoading ? 'Đang tải…' : external.length ? 'Làm mới' : 'Tải lịch nhóm'}</button></div></div>}
      </section>
      {viewingShared && compare && <SharedAvailability days={days} mine={ownOccurrences.rows} theirs={peerOccurrences.rows} ready={ownReady && peerPlanner.ready && !peerPlanner.error && !ownOccurrences.error && !peerOccurrences.error} peerName={peerName}/>}
      <TaskTimeline key={viewOwner} days={days} tasks={displayedTasks} onSelect={chooseTask} readOnly={viewingShared}/>
      <div className="planning-workbench"><TaskList key={viewOwner} tasks={displayedTasks} onSelect={chooseTask} ownerName={peerName} onToggle={viewingShared ? null : toggleTask} onDelete={viewingShared ? null : task => removeRecord('tasks',task.id)} onAdd={viewingShared ? null : () => newTask({ start: dateKey(new Date()), end: dateKey(new Date()) })}/><PlanningSummary tasks={displayedTasks} events={baseEvents} calendarRange={range} onSelect={chooseTask} ownerName={peerName} onShare={viewingShared ? null : () => setShareOpen(true)} onClass={viewingShared ? null : () => setClassOpen(open => !open)} classOpen={classOpen}/></div>
      {!viewingShared && classOpen && <Suspense fallback={<p role="status">Đang mở lịch lớp…</p>}><ClassBoard key={demo ? 'demo-class' : user.uid} taskState={classTaskState} days={days} onClose={() => setClassOpen(false)}/></Suspense>}
    </main>
    {selectedTask && <TaskDrawer key={`${viewOwner}:${selectedTask.id || 'new'}`} item={selectedTask} readOnly={viewingShared} ownerName={peerName} onClose={() => setSelected(null)} onSave={(data, id) => saveRecord('tasks', data, id)} onDelete={id => removeRecord('tasks', id)}/>}
    {!viewingShared && eventEditor && <AddEventModal key={eventEditor.id || 'new'} item={eventEditor.id ? eventEditor : null} initialDate={eventEditor.initialDate || dateKey(days[0])} onClose={() => setEventEditor(null)} onAdd={(data, id) => saveRecord('events', data, id)} onDelete={id => removeRecord('events', id)}/>}
    {selectedEvent && <EventDetails item={selectedEvent} onClose={() => setReadEvent(null)}/>}
    {!viewingShared && shareOpen && <ShareModal user={user} demo={demo} onClose={() => setShareOpen(false)}/>}
  </div>;
}
