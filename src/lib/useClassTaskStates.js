import { useEffect, useState } from 'react';
import { db, collection, doc, onSnapshot, setDoc, serverTimestamp, firebaseError } from './firebase';

export default function useClassTaskStates(user, demo, enabled) {
  const scope = demo ? 'demo' : user?.uid || '';
  const [store,setStore] = useState({ scope:'', rows:{}, ready:false, error:'' });
  const current = store.scope === scope ? store : { rows:{}, ready:false, error:'' };
  useEffect(() => {
    if (!scope) { setStore({scope:'',rows:{},ready:false,error:''}); return; }
    if (!enabled) return;
    if (demo) { setStore(old => ({ scope, rows:old.scope === scope ? old.rows : {}, ready:true, error:'' })); return; }
    let active = true;
    setStore(old => ({ scope, rows:old.scope === scope ? old.rows : {}, ready:false, error:'' }));
    const stop = onSnapshot(collection(db,'profiles',scope,'classTaskStates'), snapshot => {
      if (active) setStore({ scope, rows:Object.fromEntries(snapshot.docs.map(item => [item.id,item.data()])), ready:true, error:'' });
    }, err => { if (active) setStore({ scope, rows:{}, ready:false, error:firebaseError(err) }); });
    return () => { active = false; stop(); };
  },[scope,demo,enabled]);
  async function update(item, patch) {
    if (!enabled || !current.ready || item.kind !== 'task' || !/^class:[a-zA-Z0-9_-]+$/.test(item.id)) throw new Error('Không thể cập nhật trạng thái công việc lớp lúc này.');
    const value = { sourceId:item.id, completed:current.rows[item.id]?.completed === true, deleted:current.rows[item.id]?.deleted === true, ...patch };
    if (!demo) await setDoc(doc(db,'profiles',scope,'classTaskStates',item.id), { ...value, updatedAt:serverTimestamp() });
    // A late response may only update the same account's state.
    setStore(old => old.scope === scope ? { ...old, rows:{ ...old.rows,[item.id]:value } } : old);
  }
  return { states:current.rows, ready:current.ready, error:current.error, update };
}
