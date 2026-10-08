package com.nguyendangminh.planner;
import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.*;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.*;
import com.google.android.gms.tasks.Tasks;
import org.json.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class WidgetTaskWorker extends Worker {
    static final String TAG="planner_widget_ticks";
    public WidgetTaskWorker(@NonNull Context c,@NonNull WorkerParameters params){super(c,params);}
    public static void enqueue(Context c,String uid,String id,boolean complete){
        PlannerStore.taskWidgetState(c,uid,id,"pending");
        Data data=new Data.Builder().putString("uid",uid).putString("id",id).putBoolean("complete",complete).build();
        WorkManager.getInstance(c).enqueueUniqueWork("widget_tick_"+uid+"_"+id,ExistingWorkPolicy.KEEP,new OneTimeWorkRequest.Builder(WidgetTaskWorker.class).setInputData(data).addTag(TAG).setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).build());
    }
    public static void cancel(Context c){WorkManager.getInstance(c).cancelAllWorkByTag(TAG);}
    boolean authorized(Context c,String uid){var user=FirebaseAuth.getInstance().getCurrentUser();return user!=null&&uid.equals(user.getUid())&&uid.equals(PlannerStore.owner(c));}
    @NonNull @Override public Result doWork(){
        Context c=getApplicationContext();String uid=getInputData().getString("uid"),id=getInputData().getString("id");boolean complete=getInputData().getBoolean("complete",true);
        if(uid==null||id==null||id.contains("/"))return Result.failure();PlannerStore.firebase(c);
        if(!authorized(c,uid))return Result.success();
        try{
            DocumentReference ref=FirebaseFirestore.getInstance().collection("tasks").document(id);
            Map<String,Object> latest=Tasks.await(FirebaseFirestore.getInstance().runTransaction(transaction->{
                if(!authorized(c,uid))throw new FirebaseFirestoreException("Account changed",FirebaseFirestoreException.Code.UNAUTHENTICATED);
                DocumentSnapshot snapshot=transaction.get(ref);if(!snapshot.exists())throw new FirebaseFirestoreException("Task removed",FirebaseFirestoreException.Code.NOT_FOUND);
                if(!uid.equals(snapshot.getString("ownerId")))throw new FirebaseFirestoreException("Not owner",FirebaseFirestoreException.Code.PERMISSION_DENIED);
                Map<String,Object> current=new HashMap<>(snapshot.getData()),patch=WidgetTaskCompletion.setCompleted(current,complete);
                if(!patch.isEmpty()){Map<String,Object> update=new HashMap<>(patch);update.put("updatedAt",FieldValue.serverTimestamp());transaction.update(ref,update);current.putAll(patch);}return current;
            }),90,TimeUnit.SECONDS);
            if(authorized(c,uid)){JSONObject row=PlannerSyncWorker.record(latest);row.put("id",id);PlannerStore.updateTask(c,uid,id,row);PlannerStore.taskWidgetState(c,uid,id,"");PlannerSyncWorker.refresh(c);}
            return Result.success();
        }catch(Exception error){
            Throwable cause=error;while(cause.getCause()!=null)cause=cause.getCause();
            if(cause instanceof FirebaseFirestoreException failure&&EnumSet.of(FirebaseFirestoreException.Code.UNAVAILABLE,FirebaseFirestoreException.Code.DEADLINE_EXCEEDED,FirebaseFirestoreException.Code.ABORTED).contains(failure.getCode()))return Result.retry();
            if(getRunAttemptCount()<3&&!(cause instanceof FirebaseFirestoreException))return Result.retry();
            PlannerStore.taskWidgetState(c,uid,id,"error");PlannerSyncWorker.refresh(c);return Result.failure();
        }
    }
}
