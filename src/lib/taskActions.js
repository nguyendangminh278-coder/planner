export const isTaskComplete = task => task.progress >= 100;
const savedProgress = item => Number.isFinite(item.previousProgress) && item.previousProgress >= 0 && item.previousProgress < 100 ? item.previousProgress : null;
const completeStep = step => isTaskComplete(step) ? { ...step } : { ...step, progress:100, previousProgress:step.progress || 0 };
const reopenStep = step => ({ ...step, progress:savedProgress(step) ?? 0, previousProgress:null });
export const clearCompletionBackup = step => { const {taskCompletionBackup,...value} = step; return value; };

export function stepsProgress(steps) {
  if (!steps.length) return 0;
  if (steps.every(isTaskComplete)) return 100;
  return Math.min(99,Math.round(steps.reduce((sum,step) => sum + (Number(step.progress) || 0),0)/steps.length));
}

export function taskCompletionPatch(task) {
  const steps = task.steps || [];
  if (isTaskComplete(task)) {
    let restored = steps.map(step => step.taskCompletionBackup ? {...clearCompletionBackup(step),...step.taskCompletionBackup} : savedProgress(step) !== null ? reopenStep(step) : {...step});
    // A legacy fully completed tree with no undo history must become unfinished too.
    if (restored.length && restored.every(isTaskComplete)) restored = restored.map(reopenStep);
    return { progress:savedProgress(task) ?? stepsProgress(restored), previousProgress:null, ...(steps.length ? {steps:restored} : {}) };
  }
  return { progress:100, previousProgress:Number.isFinite(Number(task.progress)) && Number(task.progress) >= 0 ? Number(task.progress) : 0, ...(steps.length ? {steps:steps.map(step => ({...completeStep(step),taskCompletionBackup:{progress:step.progress || 0,previousProgress:step.previousProgress ?? null}}))} : {}) };
}

export function stepCompletionPatch(task, stepId) {
  const steps = task.steps || [];
  if (!steps.some(step => step.id === stepId)) throw new Error('Bước này không còn tồn tại.');
  const next = steps.map(step => { const current = clearCompletionBackup(step); return step.id === stepId ? isTaskComplete(current) ? reopenStep(current) : completeStep(current) : current; });
  return {steps:next, progress:stepsProgress(next), previousProgress:null};
}

export function taskTabs(tasks, today) {
  return {
    today: tasks.filter(task => task.start <= today),
    upcoming: tasks.filter(task => task.start > today),
    completed: tasks.filter(isTaskComplete),
  };
}

export function applyClassTaskStates(items, states) {
  return items.filter(item => item.kind !== 'task' || !states[item.id]?.deleted)
    .map(item => item.kind === 'task' ? { ...item, completed: states[item.id]?.completed === true } : item);
}
