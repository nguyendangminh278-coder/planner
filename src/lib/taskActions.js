export const isTaskComplete = task => task.progress >= 100;

export function taskCompletionPatch(task) {
  if (isTaskComplete(task)) return { progress: Number.isFinite(task.previousProgress) && task.previousProgress >= 0 && task.previousProgress < 100 ? task.previousProgress : 0, previousProgress: null };
  return { progress: 100, previousProgress: Number.isFinite(task.progress) && task.progress >= 0 ? task.progress : 0 };
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
