package com.nguyendangminh.planner;
import org.junit.Test;import static org.junit.Assert.*;import java.util.*;
public class WidgetTaskCompletionTest {
    Map<String,Object> step(String id,int progress){Map<String,Object> row=new HashMap<>();row.put("id",id);row.put("progress",progress);row.put("details","Keep notes");row.put("startTime","09:00");return row;}
    @Test public void completeAndUndoKeepFinishedStepsAndRestorePartialProgress(){
        var a=step("a",100);a.put("previousProgress",10);var b=step("b",40);Map<String,Object> task=new HashMap<>();task.put("progress",70);task.put("steps",List.of(a,b));
        var patch=WidgetTaskCompletion.setCompleted(task,true);assertEquals(100,patch.get("progress"));task.putAll(patch);var restored=WidgetTaskCompletion.setCompleted(task,false);assertEquals(70.0,((Number)restored.get("progress")).doubleValue(),0);
        var rows=(List<Map<String,Object>>)restored.get("steps");assertEquals(100.0,((Number)rows.get(0).get("progress")).doubleValue(),0);assertEquals(40.0,((Number)rows.get(1).get("progress")).doubleValue(),0);assertEquals("Keep notes",rows.get(1).get("details"));assertEquals("09:00",rows.get(1).get("startTime"));assertFalse(rows.get(1).containsKey("taskCompletionBackup"));assertEquals(40,b.get("progress"));
    }
    @Test public void staleRepeatedTickIsIdempotentRatherThanUndoingServerCompletion(){Map<String,Object> task=new HashMap<>();task.put("progress",100);task.put("previousProgress",20);assertTrue(WidgetTaskCompletion.setCompleted(task,true).isEmpty());task.put("progress",20);assertTrue(WidgetTaskCompletion.setCompleted(task,false).isEmpty());}
    @Test public void legacyCompletedTreeReopensWithoutBackups(){Map<String,Object> task=new HashMap<>();task.put("progress",100);task.put("steps",List.of(step("a",100),step("b",100)));var patch=WidgetTaskCompletion.setCompleted(task,false);assertEquals(0,patch.get("progress"));assertNull(patch.get("previousProgress"));for(var row:(List<Map<String,Object>>)patch.get("steps"))assertEquals(0,row.get("progress"));}
}
