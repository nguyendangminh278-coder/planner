import { useEffect, useState } from 'react';
import { db, collection, collectionGroup, query, where, onSnapshot, firebaseError } from './firebase';
import { demoSharedEvents, demoSharedTasks } from './mock';

export const demoPeer = { ownerId: 'demo-peer', ownerName: 'Bùi Duy Tiến' };
const empty = { ownerId: null, events: [], tasks: [], ready: false, loading: false, error: '' };
const safeColor = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#e0e7ff';
const progress = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
const readTask = task => ({ ...task, color: safeColor(task.color), progress: progress(task.progress), details: typeof task.details === 'string' ? task.details : '', steps: Array.isArray(task.steps) ? task.steps.filter(step => step && typeof step === 'object').map((step,index) => ({ ...step, id: typeof step.id === 'string' ? step.id : `step-${index}`, title: typeof step.title === 'string' ? step.title : 'Bước chưa có tên', details: typeof step.details === 'string' ? step.details : '', color: safeColor(step.color), progress: progress(step.progress) })) : [] });

export default function useSharedPlanner(user, demo, selectedOwner) {
  const [grants, setGrants] = useState([]), [grantError, setGrantError] = useState('');
  const [data, setData] = useState(empty);
  useEffect(() => {
    setGrants([]); setGrantError('');
    if (!user?.emailVerified || demo) return;
    return onSnapshot(query(collectionGroup(db, 'viewers'), where('viewerEmail', '==', user.email.toLowerCase())), snapshot => {
      const owners = new Map();
      for (const record of snapshot.docs) {
        const value = record.data(), path = record.ref.path.split('/');
        if (path.length !== 4 || path[0] !== 'calendarShares' || path[1] !== value.ownerId || value.ownerId === user.uid || value.permission !== 'read') continue;
        owners.set(value.ownerId, { ownerId: value.ownerId, ownerName: typeof value.ownerName === 'string' && value.ownerName.trim() ? value.ownerName : 'Người chia sẻ' });
      }
      setGrants([...owners.values()].sort((a, b) => a.ownerName.localeCompare(b.ownerName))); setGrantError('');
    }, err => { setGrants([]); setGrantError(firebaseError(err)); });
  }, [user, demo]);
  const owners = demo ? [demoPeer] : grants;
  const allowed = selectedOwner !== 'me' && owners.some(owner => owner.ownerId === selectedOwner);

  useEffect(() => {
    if (!allowed || demo || !user) { setData(empty); return; }
    let active = true, failed = false, eventsReady = false, tasksReady = false;
    setData({ ...empty, ownerId: selectedOwner, loading: true });
    const onError = err => {
      failed = true;
      if (active) setData({ ...empty, ownerId: selectedOwner, error: err.code === 'permission-denied' ? 'Quyền xem lịch và công việc đã bị thu hồi hoặc không còn hợp lệ.' : firebaseError(err) });
    };
    const subscribe = kind => onSnapshot(query(collection(db, kind), where('ownerId', '==', selectedOwner)), snapshot => {
      if (!active || failed) return;
      if (kind === 'events') eventsReady = true; else tasksReady = true;
      const rows = snapshot.docs.map(record => ({ ...record.data(), id: record.id }));
      setData(current => ({ ...current, [kind]: kind === 'tasks' ? rows.map(readTask) : rows, ready: eventsReady && tasksReady, loading: !(eventsReady && tasksReady) }));
    }, onError);
    const stopEvents = subscribe('events'), stopTasks = subscribe('tasks');
    return () => { active = false; stopEvents(); stopTasks(); };
  }, [allowed, demo, user, selectedOwner]);

  const planner = demo && allowed
    ? { ownerId: demoPeer.ownerId, events: demoSharedEvents, tasks: demoSharedTasks, ready: true, loading: false, error: '' }
    : allowed && data.ownerId === selectedOwner ? data : { ...empty, loading: allowed };
  return { owners, planner, grantError };
}
