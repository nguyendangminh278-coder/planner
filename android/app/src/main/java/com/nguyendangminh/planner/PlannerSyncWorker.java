package com.nguyendangminh.planner;
import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.*;
import com.google.android.gms.tasks.Tasks;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.*;
import org.json.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class PlannerSyncWorker extends Worker {
    public PlannerSyncWorker(@NonNull Context context,@NonNull WorkerParameters params){super(context,params);}
    static WorkManager manager(Context c){return WorkManager.getInstance(c);}
    public static void schedule(Context c){
        if("demo-user".equals(PlannerStore.owner(c)))return;
        manager(c).enqueueUniquePeriodicWork("planner_agenda_sync",ExistingPeriodicWorkPolicy.KEEP,new PeriodicWorkRequest.Builder(PlannerSyncWorker.class,1,TimeUnit.HOURS).setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build());
    }
    public static void refresh(Context c){manager(c).enqueueUniqueWork("planner_agenda_refresh",ExistingWorkPolicy.KEEP,new OneTimeWorkRequest.Builder(PlannerSyncWorker.class).setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build());}
    public static void cancel(Context c){manager(c).cancelUniqueWork("planner_agenda_sync");manager(c).cancelUniqueWork("planner_agenda_refresh");}
    static final String[] FIELDS={"id","title","start","end","allDay","startTime","endTime","timeZone","progress","color","recurrence","steps"};
    static JSONObject record(Map<String,Object> map)throws JSONException{
        JSONObject result=new JSONObject();for(String field:FIELDS)if(map.containsKey(field)){
            Object value=map.get(field);
            if(field.equals("steps")&&value instanceof List<?> list){JSONArray steps=new JSONArray();for(Object item:list)if(item instanceof Map<?,?> step)steps.put(record((Map<String,Object>)step));result.put(field,steps);}
            else result.put(field,JSONObject.wrap(value));
        }if(map.get("details") instanceof String details)result.put("summary",WidgetData.summary(details));return result;
    }
    @NonNull @Override public Result doWork(){
        Context c=getApplicationContext();String owner=PlannerStore.owner(c);if(owner.isEmpty()||owner.equals("demo-user"))return Result.success();
        PlannerStore.firebase(c);var user=FirebaseAuth.getInstance().getCurrentUser();if(user==null||!owner.equals(user.getUid()))return Result.success();
        try{
            JSONObject data=new JSONObject();FirebaseFirestore db=FirebaseFirestore.getInstance();
            for(String kind:Arrays.asList("events","tasks")){
                QuerySnapshot snapshot=Tasks.await(db.collection(kind).whereEqualTo("ownerId",owner).get(Source.SERVER),25,TimeUnit.SECONDS);JSONArray rows=new JSONArray();
                for(DocumentSnapshot doc:snapshot.getDocuments()){JSONObject row=record(doc.getData());row.put("id",doc.getId());rows.put(row);}data.put(kind,rows);
            }
            synchronized(PlannerStore.class){var current=FirebaseAuth.getInstance().getCurrentUser();if(owner.equals(PlannerStore.owner(c))&&current!=null&&owner.equals(current.getUid()))PlannerStore.save(c,owner,data);}
            return Result.success();
        }catch(Exception e){return Result.retry();}
    }
}

