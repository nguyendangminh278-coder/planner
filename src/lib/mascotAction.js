// Animation is optional; the user's data operation must still run exactly once.
export async function mascotMutation({play,commit,cleanup=()=>{}}) {
  let success=false;
  try {
    try { await play?.(); } catch { /* An interrupted visual never drops the action. */ }
    const result=await commit(); success=result!==false; return result;
  } finally {
    try { await cleanup(success); } catch { /* Preserve the original data result/error. */ }
  }
}

export function mascotAnchor(rect,width,height,size=104) {
  const reverse=rect.left<size+6;
  const tip=size*(reverse ? 0.02 : 0.98);
  return {reverse,x:Math.max(4,Math.min(width-size-4,(reverse?rect.right:rect.left)-tip)),y:Math.max(4,Math.min(height-size-4,rect.top+rect.height/2-size*.48))};
}
