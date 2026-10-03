import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, LogOut, Users, RefreshCw, Share2, Plus, Droplets, List, Grid2X2 } from 'lucide-react';
import Login from './components/Login';
import CalendarWeek from './components/CalendarWeek';
import TaskTimeline from './components/TaskTimeline';
import TaskDrawer from './components/TaskDrawer';
import AddEventModal from './components/AddEventModal';
import ShareModal from './components/ShareModal';
import MoodWeather from './components/MoodWeather';
import WeekAgenda from './components/WeekAgenda';
import { TaskList, PlanningSummary } from './components/TaskOverview';
import { weekDays, fmtShort, dateKey } from './lib/date';
import { demoEvents, demoSharedEvents, demoTasks, demoUser } from './lib/mock';
import { auth, db, onAuthStateChanged, signOut, collection, collectionGroup, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, doc, serverTimestamp, firebaseError } from './lib/firebase';

function Avatar({ user }) { return user.photoURL ? <img className="avatar" src={user.photoURL} alt="Ảnh tài khoản" referrerPolicy="no-referrer"/> : <div className="avatar fallback">{(user.displayName || 'U').slice(0, 1)}</div>; }
const unpack = snapshot => snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
const ClassBoard = lazy(() => import('./components/ClassBoard'));

export default function App() {
  const [user, setUser] = useState(null), [authLoading, setAuthLoading] = useState(true), [demo, setDemo] = useState(false);
  const [week, setWeek] = useState(new Date());
  const [events, setEvents] = useState([]), [shared, setShared] = useState([]), [tasks, setTasks] = useState([]);
  const [external, setExternal] = useState([]), [showExternal, setShowExternal] = useState(true);
  const [classOpen, setClassOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('agenda');
  const [selected, setSelected] = useState(null), [eventEditor, setEventEditor] = useState(null), [shareOpen, setShareOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false), [dataLoading, setDataLoading] = useState(false), [error, setError] = useState('');
  const days = useMemo(() => weekDays(week), [week]);

  useEffect(() => onAuthStateChanged(auth, next => {
    setUser(next); setDemo(false); setEvents([]); setTasks([]); setShared([]); setExternal([]); setClassOpen(false); setError(''); setSelected(null); setEventEditor(null); setShareOpen(false); setAuthLoading(false);
  }, err => { setError(firebaseError(err)); setAuthLoading(false); }), []);

  useEffect(() => {
    if (!user || demo) return;
    setDataLoading(true);
    const onError = err => { setError(firebaseError(err)); setDataLoading(false); };
    let eventsReady = false, tasksReady = false;
    const loaded = () => { if (eventsReady && tasksReady) setDataLoading(false); };
    const stopEvents = onSnapshot(query(collection(db, 'events'), where('ownerId', '==', user.uid)), s => { setEvents(unpack(s)); eventsReady = true; loaded(); }, onError);
    const stopTasks = onSnapshot(query(collection(db, 'tasks'), where('ownerId', '==', user.uid)), s => { setTasks(unpack(s).sort((a, b) => a.start.localeCompare(b.start))); tasksReady = true; loaded(); }, onError);
    setDoc(doc(db, 'profiles', user.uid), { displayName: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '', updatedAt: serverTimestamp() }, { merge: true }).catch(onError);
    return () => { stopEvents(); stopTasks(); };
  }, [user, demo]);

  useEffect(() => {
    if (!user?.emailVerified || demo) return;
    const subscriptions = new Map(), rows = new Map();
    const publish = () => setShared(Array.from(rows.values()).flat());
    const stopShares = onSnapshot(query(collectionGroup(db, 'viewers'), where('viewerEmail', '==', user.email.toLowerCase())), snapshot => {
      const owners = new Set(snapshot.docs.map(d => d.data().ownerId).filter(id => id && id !== user.uid));
      for (const [ownerId, stop] of subscriptions) if (!owners.has(ownerId)) { stop(); subscriptions.delete(ownerId); rows.delete(ownerId); }
      publish();
      for (const ownerId of owners) if (!subscriptions.has(ownerId)) {
        subscriptions.set(ownerId, onSnapshot(query(collection(db, 'events'), where('ownerId', '==', ownerId)), s => {
          rows.set(ownerId, unpack(s).map(e => ({ ...e, id: `${ownerId}:${e.id}`, source: 'shared', color: '#e5ddf8' }))); publish();
        }, err => { rows.delete(ownerId); publish(); if (err.code !== 'permission-denied') setError(firebaseError(err)); }));
      }
    }, err => { setShared([]); setError(firebaseError(err)); });
    return () => { stopShares(); subscriptions.forEach(stop => stop()); };
  }, [user, demo]);

  function enterDemo() {
    setDemo(true); setWeek(new Date('2026-10-05T00:00:00+07:00')); setEvents(structuredClone(demoEvents)); setTasks(structuredClone(demoTasks)); setShared(structuredClone(demoSharedEvents).map(e => ({ ...e, source: 'shared' }))); setExternal([]); setDataLoading(false); setError('');
  }
  async function saveRecord(kind, data, id) {
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
    if (demo) { (kind === 'events' ? setEvents : setTasks)(rows => rows.filter(row => row.id !== id)); return; }
    if (!user) throw new Error('Not signed in');
    await deleteDoc(doc(db, kind, id));
  }
  async function logout() {
    try { if (demo) { setDemo(false); setEvents([]); setTasks([]); setShared([]); setExternal([]); setClassOpen(false); setError(''); } else await signOut(auth); }
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
      setExternal(rows.map((e, i) => ({ ...e, id: `external:${e.id || i}`, source: 'external', color: e.color || '#d7f0ee' })));
    } catch { setError('Không tải được lịch nhóm. Hãy kiểm tra kết nối và định dạng dữ liệu API.'); }
    finally { setApiLoading(false); }
  }

  const activeUser = demo ? demoUser : user;
  const visibleEvents = [...events, ...shared, ...(showExternal ? external : [])];
  if (authLoading) return <div className="loading-screen" role="status">Đang mở Planner…</div>;
  if (!activeUser) return <Login onDemo={enterDemo}/>;
  return <div className="app-shell">
    <header className="topbar"><div className="logo"><span>p</span><b>Planner</b></div><div className="top-actions">
      <button className="soft-btn" onClick={() => setEventEditor({})}><CalendarPlus size={16}/>Thêm lịch</button>
      <button className="soft-btn" onClick={() => setShareOpen(true)}><Share2 size={16}/>Chia sẻ lịch</button>
      <div className="profile"><Avatar user={activeUser}/><div><b>{activeUser.displayName}</b><small>{activeUser.email}</small></div><button className="icon-btn" aria-label="Đăng xuất" onClick={logout}><LogOut size={18}/></button></div>
    </div></header>
    <main>
      {demo && <div className="notice" role="status">Bản demo — thay đổi chỉ lưu trong phiên này. Đăng nhập Google để lưu dữ liệu thật.</div>}
      {error && <div className="error-banner" role="alert">{error}<button className="text-btn" onClick={() => setError('')}>Đóng</button></div>}
      <section className="hero-strip"><div><span className="eyebrow">YOUR PERSONAL PLANNING SPACE</span><h1>Planner</h1><p><Droplets size={18}/>Flow of Knowledge <span className="hero-divider"/>Lịch, công việc & nhịp sống của bạn</p></div>
        <div className="week-switch"><button className="icon-btn" aria-label="Tuần trước" onClick={() => setWeek(d => { const x = new Date(d); x.setDate(x.getDate() - 7); return x; })}><ChevronLeft/></button><div><b>{fmtShort(days[0])} — {fmtShort(days[5])}</b><small>Thứ 2 → Thứ 7 · {days[0].getFullYear()}</small></div><button className="icon-btn" aria-label="Tuần sau" onClick={() => setWeek(d => { const x = new Date(d); x.setDate(x.getDate() + 7); return x; })}><ChevronRight/></button></div>
      </section>
      <MoodWeather key={demo ? 'demo-moods' : user.uid} user={user} demo={demo}/>
      <div className="board-actions"><button className="soft-btn" onClick={() => setWeek(new Date())}>Tuần này</button><button className="soft-btn" onClick={() => setEventEditor({})}><CalendarPlus size={16}/>Thêm lịch</button><button className="soft-btn" onClick={() => setSelected({ start: dateKey(days[0]), end: dateKey(days[5]) })}><Plus size={16}/>Thêm công việc</button><button className="soft-btn" onClick={() => setShareOpen(true)}><Share2 size={16}/>Chia sẻ lịch</button><button className={`soft-btn ${classOpen ? 'active' : ''}`} aria-expanded={classOpen} onClick={() => setClassOpen(open => !open)}><Users size={16}/>{classOpen ? 'Ẩn lịch & task lớp' : 'Xem lịch & task lớp'}</button></div>
      {dataLoading && <p role="status">Đang tải dữ liệu của bạn…</p>}
      <section className="calendar-area"><div className="section-head"><div><span className="eyebrow">WEEKLY CALENDAR</span><h2><CalendarDays size={22}/>Lịch trong tuần</h2></div><div className="calendar-view-switch" role="group" aria-label="Kiểu xem lịch"><button type="button" className={calendarView === 'agenda' ? 'active' : ''} aria-pressed={calendarView === 'agenda'} onClick={() => setCalendarView('agenda')}><List size={15}/>Theo ngày</button><button type="button" className={calendarView === 'grid' ? 'active' : ''} aria-pressed={calendarView === 'grid'} onClick={() => setCalendarView('grid')}><Grid2X2 size={15}/>Lưới giờ</button></div></div>
        {calendarView === 'agenda' ? <WeekAgenda days={days} events={visibleEvents} onSelect={setEventEditor} onAdd={date => setEventEditor({ initialDate: date })}/> : <CalendarWeek days={days} events={[...events, ...shared]} externalEvents={external} showExternal={showExternal} onSelect={setEventEditor} hideHeader/>}
        <div className="api-ribbon"><div><Users size={15}/><b>Lịch nhóm API</b><span>Hiện cùng lịch của bạn</span></div><div><label className="switch"><input aria-label="Hiện lịch nhóm" type="checkbox" checked={showExternal} onChange={e => setShowExternal(e.target.checked)}/><i/></label><button className="text-btn" disabled={apiLoading} onClick={loadExternal}><RefreshCw size={14} className={apiLoading ? 'spin' : ''}/>{apiLoading ? 'Đang tải…' : external.length ? 'Làm mới' : 'Tải lịch nhóm'}</button></div></div>
      </section>
      <TaskTimeline days={days} tasks={tasks} onSelect={setSelected}/>
      <div className="planning-workbench"><TaskList tasks={tasks} onSelect={setSelected} onAdd={() => setSelected({ start: dateKey(new Date()), end: dateKey(new Date()) })}/><PlanningSummary tasks={tasks} events={visibleEvents} onSelect={setSelected} onShare={() => setShareOpen(true)} onClass={() => setClassOpen(open => !open)} classOpen={classOpen}/></div>
      {classOpen && <Suspense fallback={<p role="status">Đang mở lịch lớp…</p>}><ClassBoard days={days} onClose={() => setClassOpen(false)}/></Suspense>}
    </main>
    {selected && <TaskDrawer key={selected.id || 'new'} item={selected} onClose={() => setSelected(null)} onSave={(data, id) => saveRecord('tasks', data, id)} onDelete={id => removeRecord('tasks', id)}/>}
    {eventEditor && <AddEventModal key={eventEditor.id || 'new'} item={eventEditor.id ? eventEditor : null} initialDate={eventEditor.initialDate || dateKey(days[0])} onClose={() => setEventEditor(null)} onAdd={(data, id) => saveRecord('events', data, id)} onDelete={id => removeRecord('events', id)}/>}
    {shareOpen && <ShareModal user={user} demo={demo} onClose={() => setShareOpen(false)}/>}
  </div>;
}
