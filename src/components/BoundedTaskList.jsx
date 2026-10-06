import {useLayoutEffect,useRef,useState} from 'react';

export default function BoundedTaskList({children,label,resetKey,className=''}) {
  const ref = useRef(null), [height,setHeight] = useState(520);
  useLayoutEffect(() => {
    const node = ref.current;
    const cards = [...node.querySelectorAll(':scope > [data-task-card]')];
    const measure = () => setHeight(cards.length >= 5 ? Math.min(520,cards[4].offsetTop+cards[4].offsetHeight) : 520);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node); cards.slice(0,5).forEach(card => observer.observe(card));
    return () => observer.disconnect();
  },[children]);
  useLayoutEffect(() => { ref.current.scrollTop = 0; },[resetKey]);
  return <div ref={ref} className={`bounded-task-list ${className}`} style={{maxHeight:height}} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}
