import {useEffect,useState,useCallback} from 'react';
import {App as NativeApp} from '@capacitor/app';
import {isAndroid,PlannerAndroid} from './android';
import {mobileRecords} from './mobileAgenda';
let syncQueue=Promise.resolve();
const enqueue=fn => {const next=syncQueue.catch(()=>{}).then(fn);syncQueue=next;return next;};
export default function useAndroidAgenda({user,demo,authLoading,ready,events,tasks,onOpen}) {
  const [error,setError]=useState(''),[revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(value=>value+1),[]);
  useEffect(()=>{
    if(!isAndroid)return;
    let stopped=false;
    const listener=NativeApp.addListener('appStateChange',state=>{if(state.isActive&&!stopped)refresh();});
    return()=>{stopped=true;listener.then(handle=>handle.remove());};
  },[refresh]);
  useEffect(()=>{
    if(!isAndroid || authLoading)return;
    let active=true;
    // A cold web session can be missing while native auth/widgets are still valid.
    // Clear native data only on explicit logout, not while the web SDK restores itself.
    const operation=(user||demo)&&ready ? ()=>PlannerAndroid.syncAgenda({ownerId:demo?'demo-user':user.uid,demo,...mobileRecords(events,tasks)}) : null;
    if(operation)enqueue(operation).then(()=>{if(active)setError('');},()=>{if(active)setError('Chưa cập nhật được widget/nhắc việc. Mở lại app để thử đồng bộ.');});
    return()=>{active=false;};
  },[user?.uid,demo,authLoading,ready,events,tasks,revision]);
  useEffect(()=>{
    if(!isAndroid || !ready)return;
    let active=true;
    const open=data=>{if(active&&data?.key)onOpen(data.key);};
    const listener=PlannerAndroid.addListener('openRecord',open);
    PlannerAndroid.consumeOpenRecord().then(open).catch(()=>{});
    return()=>{active=false;listener.then(handle=>handle.remove());};
  },[onOpen,ready]);
  return {error,refresh};
}
