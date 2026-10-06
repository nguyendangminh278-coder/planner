import {createContext,useCallback,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import mascotAtlas from '../assets/mascot/pose-atlas.png';
import {mascotMutation,mascotAnchor} from '../lib/mascotAction';

const MascotContext=createContext(null);
const home=()=>({x:Math.max(4,document.documentElement.clientWidth-124),y:Math.max(4,document.documentElement.clientHeight-126)});
const frame=()=>new Promise(resolve=>{const timer=setTimeout(resolve,120);requestAnimationFrame(()=>{clearTimeout(timer);resolve();});});
const initialPreference=()=>{try{return localStorage.getItem('planner.mascot.enabled')!=='false';}catch{return true;}};
export const usePlannerMascot=()=>useContext(MascotContext);

export function mascotTarget(button,whole=false) {
  const row=whole ? button.closest('[data-task-card],.class-task,.class-item,.task-group,.task-grid-card,.step-editor') : button.closest('.task-action-row,.timeline-row,.task-grid-card,.step-editor,.step-completion-heading');
  return {row:row || button,title:row?.querySelector('.task-title,.task-label .text-btn b,.timeline-step-open>span,.timeline-bar>span') || button};
}

export function MascotProvider({children}) {
  const [enabled,setEnabled]=useState(initialPreference),[busy,setBusy]=useState(false),[visual,setVisual]=useState({pose:'idle',point:null,flip:false,stroke:null}),[message,setMessage]=useState('');
  const actor=useRef(null),line=useRef(null),layer=useRef(null),available=useRef(false),working=useRef(false),reduced=useRef(false),preference=useRef(enabled),position=useRef(null),animations=useRef(new Set()),cleanupVisual=useRef(null),deleteTarget=useRef(null),assetReady=useRef(false);
  preference.current=enabled;
  const cancelVisual=useCallback(()=>{
    for(const animation of animations.current) animation.cancel(); animations.current.clear();
    cleanupVisual.current?.(); cleanupVisual.current=null;
  },[]);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{reduced.current=media.matches;if(media.matches)cancelVisual();}; update();media.addEventListener('change',update);
    return()=>{media.removeEventListener('change',update);cancelVisual();};
  },[cancelVisual]);
  useEffect(()=>{const image=new Image();image.onload=()=>{assetReady.current=true;};image.src=mascotAtlas;return()=>{image.onload=null;};},[]);
  const register=useCallback(active=>{available.current=active;return()=>{available.current=false;cancelVisual();};},[cancelVisual]);
  const toggleEnabled=useCallback(()=>setEnabled(old=>{const next=!old;try{localStorage.setItem('planner.mascot.enabled',String(next));}catch{}return next;}),[]);
  async function animate(element,keyframes,duration) {
    if(!element || !available.current || reduced.current) throw new Error('Visual interrupted');
    const animation=element.animate(keyframes,{duration,easing:'cubic-bezier(.3,.05,.2,1)',fill:'forwards'});
    animations.current.add(animation);
    try {await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{animation.cancel();reject(new Error('Visual timeout'));},duration+900);animation.finished.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
    catch(error){animations.current.delete(animation);animation.cancel();throw error;}
  }
  async function move(to,pose='run',duration=650,flip=null) {
    const from=position.current || home();
    setVisual(old=>({...old,pose,point:from,flip:flip ?? (pose==='run'&&to.x<from.x)})); await frame();
    await animate(actor.current,[{transform:`translate(${from.x}px,${from.y}px)`},{transform:`translate(${to.x}px,${to.y}px)`}],duration);
    position.current=to; setVisual(old=>({...old,point:to})); await frame();
  }
  const runAction=useCallback(async({kind,target,commit})=>{
    if(!available.current || !preference.current || !assetReady.current || reduced.current || working.current || !target?.row?.isConnected) return commit();
    working.current=true;setBusy(true);setMessage(kind==='delete'?'Mascot đang kéo công việc…':'Mascot đang đánh dấu hoàn thành…');
    let ghost=null,original=target.row,oldVisibility=original.style.visibility;
    const interrupt=()=>cancelVisual();
    const stopWatching=()=>{window.removeEventListener('wheel',interrupt,true);window.removeEventListener('touchmove',interrupt,true);window.removeEventListener('resize',interrupt);};
    const clean=()=>{ghost?.remove();ghost=null;if(original)original.style.visibility=oldVisibility;setVisual(old=>({...old,stroke:null}));};
    cleanupVisual.current=clean;
    try {
      return await mascotMutation({
        play:async()=>{
          target.title.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}); await frame();
          // User scrolling may cancel the visual; focus/scrollIntoView must not cancel it.
          window.addEventListener('wheel',interrupt,{capture:true,passive:true});window.addEventListener('touchmove',interrupt,{capture:true,passive:true});window.addEventListener('resize',interrupt);
          let rect=target.title.getBoundingClientRect();
          if(kind!=='delete'){
            const range=document.createRange();range.selectNodeContents(target.title);
            const textRect=range.getClientRects()[0];
            if(textRect?.width){const left=Math.max(rect.left,textRect.left),right=Math.min(rect.right,textRect.right);rect={left,right,width:Math.max(1,right-left),top:textRect.top,height:textRect.height};}
          } else rect=original.getBoundingClientRect();
          const start=kind==='delete' ? {x:Math.min(window.innerWidth-110,rect.right-20),y:Math.max(8,Math.min(window.innerHeight-110,rect.top+Math.min(rect.height/2,54)-47))} : mascotAnchor(rect,window.innerWidth,window.innerHeight);
          await move(start,'run',Math.max(450,Math.min(850,Math.hypot(start.x-(position.current||home()).x,start.y-(position.current||home()).y))));
          if(kind==='delete'){
            if(!original.isConnected)throw new Error('Target removed');
            const bounds=original.getBoundingClientRect();ghost=original.cloneNode(true);ghost.classList.add('mascot-task-ghost');ghost.inert=true;ghost.setAttribute('aria-hidden','true');
            ghost.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));ghost.removeAttribute('id');
            const computed=getComputedStyle(original);
            Object.assign(ghost.style,{position:'fixed',left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`,margin:'0',zIndex:'96',pointerEvents:'none',font:computed.font,boxSizing:'border-box'});
            for(const variable of ['--day-bg','--day-border','--day-ink'])ghost.style.setProperty(variable,computed.getPropertyValue(variable));
            (layer.current || document.body).appendChild(ghost);original.style.visibility='hidden';
            const distance=window.innerWidth-bounds.left+130;
            setVisual(old=>({...old,pose:'drag',flip:false}));await frame();
            await Promise.all([animate(ghost,[{transform:'translateX(0) rotate(0deg)',opacity:1},{transform:`translateX(${distance}px) rotate(4deg)`,opacity:0}],850),move({x:start.x+distance,y:start.y},'drag',850)]);
          }else{
            if(!original.isConnected)throw new Error('Target removed');
            setVisual(old=>({...old,pose:'write',flip:start.reverse,stroke:{x:start.reverse?rect.right:rect.left,y:rect.top+rect.height*.5,width:start.reverse?-rect.width:rect.width}}));await frame();
            const to={x:Math.max(4,Math.min(window.innerWidth-108,start.x+(start.reverse?-rect.width:rect.width))),y:start.y};
            await Promise.all([animate(line.current,[{strokeDashoffset:1},{strokeDashoffset:0}],520),move(to,'write',520,start.reverse)]);
          }
        },
        commit,
        cleanup:async success=>{
          clean();cleanupVisual.current=null;
          setMessage(success ? kind==='delete'?'Đã xóa công việc.':'Đã đánh dấu hoàn thành.' : 'Thao tác chưa thành công.');
        }
      });
    }finally{
      stopWatching();clean();cleanupVisual.current=null;for(const animation of animations.current)animation.cancel();animations.current.clear();
      if(available.current&&preference.current&&!reduced.current){try{await move(home(),'run',520);}catch{}}
      position.current=home();setVisual({pose:'idle',point:null,flip:false,stroke:null});for(const animation of animations.current)animation.cancel();animations.current.clear();working.current=false;setBusy(false);
    }
  },[]);
  const rememberDelete=useCallback(button=>{deleteTarget.current=mascotTarget(button,true);},[]);
  const prepareDeleteForId=useCallback(id=>{
    const nodes=[...document.querySelectorAll('[data-mascot-task]')].filter(node=>node.getAttribute('data-mascot-task')===id);
    const node=nodes.find(candidate=>{const rect=candidate.getBoundingClientRect();return rect.bottom>0&&rect.top<innerHeight;}) || nodes[0];
    deleteTarget.current=node ? mascotTarget(node,true) : null;
  },[]);
  const value=useMemo(()=>({enabled,busy,visual,message,actor,line,layer,register,toggleEnabled,runAction,rememberDelete,prepareDeleteForId,deleteTarget}),[enabled,busy,visual,message,register,toggleEnabled,runAction,rememberDelete,prepareDeleteForId]);
  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>;
}

export default function PlannerMascot({active,session}) {
  const mascot=usePlannerMascot();
  useLayoutEffect(()=>mascot.register(active),[active,session,mascot.register]);
  if(!active)return null;
  const point=mascot.visual.point;
  return createPortal(<div className="mascot-layer" ref={mascot.layer}><div className="mascot-status" role="status" aria-live="polite">{mascot.message}</div>{mascot.enabled ? <><div ref={mascot.actor} className={`planner-mascot ${point?'travelling':'at-home'} pose-${mascot.visual.pose}`} style={point?{left:0,top:0,right:'auto',bottom:'auto',transform:`translate(${point.x}px,${point.y}px)`}:undefined} data-mascot-pose={mascot.visual.pose} aria-hidden={mascot.busy ? 'true':undefined}><div className={`mascot-sprite ${mascot.visual.flip?'flipped':''}`} style={{backgroundImage:`url(${mascotAtlas})`}} role="img" aria-label="Mascot chibi của Planner"/>{!mascot.busy&&<button className="mascot-hide" aria-label="Ẩn mascot" title="Ẩn mascot" onClick={mascot.toggleEnabled}>×</button>}</div>{mascot.visual.stroke&&<svg className="mascot-pencil-stroke" aria-hidden="true"><line ref={mascot.line} x1={mascot.visual.stroke.x} y1={mascot.visual.stroke.y} x2={mascot.visual.stroke.x+mascot.visual.stroke.width} y2={mascot.visual.stroke.y} pathLength="1"/></svg>}</> : <button className="mascot-restore" onClick={mascot.toggleEnabled} aria-label="Hiện mascot"><span className="mascot-mini" style={{backgroundImage:`url(${mascotAtlas})`}}/>Mascot</button>}</div>,document.body);
}
