package com.nguyendangminh.planner;
import java.util.*;
/** Same completion/undo contract as taskActions.js; update only progress and its backup. */
public final class WidgetTaskCompletion {
    static double progress(Map<String,Object> item){return item.get("progress") instanceof Number n?n.doubleValue():0;}
    static Number saved(Map<String,Object> item){Object value=item.get("previousProgress");return value instanceof Number n&&Double.isFinite(n.doubleValue())&&n.doubleValue()>=0&&n.doubleValue()<100?n:null;}
    static List<Map<String,Object>> steps(Map<String,Object> task){List<Map<String,Object>> out=new ArrayList<>();if(task.get("steps") instanceof List<?> list)for(Object item:list)if(item instanceof Map<?,?> map)out.add(new HashMap<>((Map<String,Object>)map));return out;}
    static Map<String,Object> reopen(Map<String,Object> step){Map<String,Object> out=new HashMap<>(step);Number old=saved(step);out.put("progress",old==null?0:old);out.put("previousProgress",null);return out;}
    static int stepsProgress(List<Map<String,Object>> steps){if(steps.isEmpty())return 0;if(steps.stream().allMatch(step->progress(step)>=100))return 100;return Math.min(99,(int)Math.round(steps.stream().mapToDouble(WidgetTaskCompletion::progress).average().orElse(0)));}
    public static Map<String,Object> setCompleted(Map<String,Object> task,boolean complete){
        if((progress(task)>=100)==complete)return new HashMap<>();
        Map<String,Object> patch=new HashMap<>();List<Map<String,Object>> original=steps(task),next=new ArrayList<>();
        if(complete){
            patch.put("progress",100);patch.put("previousProgress",Double.isFinite(progress(task))&&progress(task)>=0?progress(task):0);
            for(var step:original){Map<String,Object> copy=new HashMap<>(step),backup=new HashMap<>();backup.put("progress",progress(step));backup.put("previousProgress",step.get("previousProgress"));
                if(progress(step)<100){copy.put("progress",100);copy.put("previousProgress",progress(step));}copy.put("taskCompletionBackup",backup);next.add(copy);}
        }else{
            for(var step:original){Object backup=step.remove("taskCompletionBackup");if(backup instanceof Map<?,?> map)step.putAll((Map<String,Object>)map);else if(saved(step)!=null)step=reopen(step);next.add(step);}
            if(!next.isEmpty()&&next.stream().allMatch(step->progress(step)>=100)){List<Map<String,Object>> reopened=new ArrayList<>();for(var step:next)reopened.add(reopen(step));next=reopened;}
            Number old=saved(task);patch.put("progress",old==null?stepsProgress(next):old);patch.put("previousProgress",null);
        }
        if(!original.isEmpty())patch.put("steps",next);return patch;
    }
}
