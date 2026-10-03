import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, LogOut, Users, RefreshCw, Share2 } from 'lucide-react';
import Login from './components/Login';
import CalendarWeek from './components/CalendarWeek';
import TaskTimeline from './components/TaskTimeline';
import TaskDrawer from './components/TaskDrawer';
import AddEventModal from './components/AddEventModal';
import { weekDays, startOfMonday, fmtShort } from './lib/date';
import { demoEvents, demoSharedEvents, demoTasks, demoUser } from './lib/mock';
import { firebaseReady, auth, db, onAuthStateChanged, signOut, collection, query, where, onSnapshot, addDoc, serverTimestamp } from './lib/firebase';

function Avatar({user}) { return user.photoURL ? <img className="avatar" src={user.photoURL}/> : <div className="avatar fallback">{(user.displayName||'U').slice(0,1)}</div> }

export default function App(){
  const [user,setUser]=useState(null), [demo,setDemo]=useState(false);
  const [week,setWeek]=useState(new Date('2026-10-05T00:00:00+07:00'));
  const [events,setEvents]=useState(demoEvents), [shared,setShared]=useState(demoSharedEvents);
  const [tasks,setTasks]=useState(demoTasks), [external,setExternal]=useState([]), [showExternal,setShowExternal]=useState(true);
  const [selected,setSelected]=useState(null), [addOpen,setAddOpen]=useState(false), [apiLoading,setApiLoading]=useState(false);
  const days=useMemo(()=>weekDays(week),[week]);

  useEffect(()=>{ if(!firebaseReady) return; return onAuthStateChanged(auth,u=>setUser(u)); },[]);

  useEffect(()=>{
    if(!firebaseReady || !user) return;
    const q=query(collection(db,'events'),where('ownerId','==',user.uid));
    return onSnapshot(q,s=>setEvents(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[user]);

  const activeUser = demo ? demoUser : user;
  if(!activeUser) return <Login onDemo={()=>setDemo(true)}/>;

  async function addEvent(e){
    if(firebaseReady && user){ await addDoc(collection(db,'events'),{...e,ownerId:user.uid,owner:user.displayName||user.email,createdAt:serverTimestamp()}); }
    else setEvents(x=>[...x,{...e,id:crypto.randomUUID()}]);
  }

  async function loadExternal(){
    const url=import.meta.env.VITE_GROUP_CALENDAR_API_URL;
    if(!url){ setExternal([
      {id:'api1',title:'Lịch nhóm: Sync sprint',start:'2026-10-07T15:00:00+07:00',end:'2026-10-07T16:00:00+07:00',color:'#d7f0ee',owner:'Team Ops',source:'external'},
      {id:'api2',title:'Lịch nhóm: Báo cáo tuần',start:'2026-10-09T10:00:00+07:00',end:'2026-10-09T11:00:00+07:00',color:'#d7f0ee',owner:'Team Ops',source:'external'}
    ]); return; }
    setApiLoading(true); try { const r=await fetch(url); const data=await r.json(); setExternal((data.events||data||[]).map(x=>({...x,source:'external',color:x.color||'#d7f0ee'}))); } finally { setApiLoading(false); }
  }

  const visibleEvents=[...events,...shared];
  return <div className="app-shell">
    <header className="topbar"><div className="logo"><span>p</span><b>Pastel Planner</b></div><div className="top-actions"><button className="soft-btn" onClick={()=>setAddOpen(true)}><CalendarPlus size={16}/>Thêm lịch</button><button className="soft-btn"><Share2 size={16}/>Chia sẻ lịch</button><div className="profile"><Avatar user={activeUser}/><div><b>{activeUser.displayName}</b><small>{activeUser.email}</small></div><button className="icon-btn" onClick={()=>firebaseReady&&user?signOut(auth):setDemo(false)}><LogOut size={18}/></button></div></div></header>

    <main>
      <section className="hero-strip"><div><span className="eyebrow">PLANNING BOARD</span><h1>Một tuần rõ việc, một quy trình rõ bước.</h1><p>Xem lịch cá nhân, lịch chia sẻ, lịch nhóm từ API và todo phân cấp trên cùng một trục thời gian.</p></div><div className="week-switch"><button className="icon-btn" onClick={()=>setWeek(d=>{let x=new Date(d);x.setDate(x.getDate()-7);return x})}><ChevronLeft/></button><div><b>{fmtShort(days[0])} — {fmtShort(days[5])}</b><small>Thứ 2 → Thứ 7</small></div><button className="icon-btn" onClick={()=>setWeek(d=>{let x=new Date(d);x.setDate(x.getDate()+7);return x})}><ChevronRight/></button></div></section>

      <div className="api-ribbon"><div><Users size={18}/><b>Lịch chung nhóm</b><span>Dữ liệu overlay từ database/API khác, không ghi đè lịch cá nhân.</span></div><div><label className="switch"><input type="checkbox" checked={showExternal} onChange={e=>setShowExternal(e.target.checked)}/><i></i></label><button className="text-btn" onClick={loadExternal}><RefreshCw size={15} className={apiLoading?'spin':''}/>{external.length?'Làm mới':'Tải lịch nhóm'}</button></div></div>

      <CalendarWeek days={days} events={visibleEvents} externalEvents={external} showExternal={showExternal}/>
      <TaskTimeline days={days} tasks={tasks} onSelect={setSelected}/>
    </main>

    <TaskDrawer item={selected} onClose={()=>setSelected(null)}/>
    {addOpen&&<AddEventModal onClose={()=>setAddOpen(false)} onAdd={addEvent}/>} 
  </div>
}
