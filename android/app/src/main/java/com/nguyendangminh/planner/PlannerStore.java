package com.nguyendangminh.planner;
import android.content.*;
import org.json.*;
import java.time.*;
import java.util.*;
import com.google.firebase.*;
import com.google.firebase.auth.FirebaseAuth;

public final class PlannerStore {
    static SharedPreferences prefs(Context c){return c.getSharedPreferences("planner_private_agenda",Context.MODE_PRIVATE);}
    public static synchronized JSONObject source(Context c){try{return new JSONObject(prefs(c).getString("source","{}"));}catch(Exception e){return new JSONObject();}}
    public static synchronized JSONObject settings(Context c){try{return new JSONObject(prefs(c).getString("settings","{\"summaryEnabled\":false,\"showTitles\":true,\"reminders\":{}}"));}catch(Exception e){return new JSONObject();}}
    public static String owner(Context c){return prefs(c).getString("owner","");}
    public static long updated(Context c){return prefs(c).getLong("updated",0);}
    public static synchronized void save(Context c,String uid,JSONObject data){
        if(!owner(c).equals(uid)){PlannerNotifications.cancelAll(c);prefs(c).edit().clear().commit();}
        prefs(c).edit().putString("owner",uid).putString("source",data.toString()).putLong("updated",System.currentTimeMillis()).commit();
        PlannerNotifications.reconcile(c);PlannerWidget.updateAll(c);PlannerSyncWorker.schedule(c);
    }
    public static synchronized void saveSettings(Context c,JSONObject settings){
        prefs(c).edit().putString("settings",settings.toString()).commit();PlannerNotifications.reconcile(c);PlannerWidget.updateAll(c);
    }
    public static synchronized void clear(Context c){PlannerNotifications.cancelAll(c);prefs(c).edit().clear().commit();PlannerSyncWorker.cancel(c);firebase(c);FirebaseAuth.getInstance().signOut();PlannerWidget.updateAll(c);}
    public static List<AgendaEngine.Entry> entries(Context c){return AgendaEngine.expand(source(c),Instant.now(),ZoneId.systemDefault());}
    public static List<AgendaEngine.Entry> today(Context c){return AgendaEngine.today(entries(c),Instant.now(),ZoneId.systemDefault());}
    public static synchronized void firebase(Context c){
        if(!FirebaseApp.getApps(c).isEmpty())return;
        // google-services.json takes precedence once the Android app is registered.
        FirebaseApp initialized=FirebaseApp.initializeApp(c);
        if(initialized==null)FirebaseApp.initializeApp(c,new FirebaseOptions.Builder()
            .setApiKey("AIzaSyAAuzuyRW6PARALwIBsYXA7z3pWdPPAUnM")
            .setApplicationId("1:894299121899:web:83689abd58d4d4489576ae")
            .setProjectId("calendar-f3d1b").setGcmSenderId("894299121899").build());
    }
}

