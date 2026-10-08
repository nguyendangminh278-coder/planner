package com.nguyendangminh.planner;
import android.app.*;
import android.content.*;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

public final class PlannerNotifications {
    static final String REMINDERS="planner_reminders",TODAY="planner_today";
    static final int SUMMARY_ID=900, REFRESH_ID=901;
    static PendingIntent alarm(Context c,int id){return PendingIntent.getBroadcast(c,id,new Intent(c,PlannerAlarmReceiver.class).setAction("planner.ALARM").putExtra("id",id),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
    public static PendingIntent open(Context c,String key,int code){return PendingIntent.getActivity(c,code,new Intent(c,MainActivity.class).setAction("planner.OPEN").putExtra("recordKey",key).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
    static void channels(Context c){
        NotificationManager m=c.getSystemService(NotificationManager.class);
        NotificationChannel reminders=new NotificationChannel(REMINDERS,"Nhắc lịch & công việc",NotificationManager.IMPORTANCE_HIGH);reminders.setDescription("Giờ hẹn của lịch, công việc và các bước");m.createNotificationChannel(reminders);
        NotificationChannel today=new NotificationChannel(TODAY,"Bảng hôm nay trên màn hình khóa",NotificationManager.IMPORTANCE_LOW);today.setDescription("Lịch và việc hôm nay, không phát âm thanh");m.createNotificationChannel(today);
    }
    public static boolean exact(Context c){return Build.VERSION.SDK_INT<31||c.getSystemService(AlarmManager.class).canScheduleExactAlarms();}
    public static boolean allowed(Context c){return NotificationManagerCompat.from(c).areNotificationsEnabled();}
    static void at(Context c,int id,long time){
        AlarmManager m=c.getSystemService(AlarmManager.class);PendingIntent p=alarm(c,id);
        if(exact(c)){try{m.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,time,p);return;}catch(SecurityException ignored){}}
        m.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,time,p);
    }
    public static void cancelAll(Context c){synchronized(PlannerStore.class){cancelAllLocked(c);}}
    static void cancelAllLocked(Context c){
        AlarmManager m=c.getSystemService(AlarmManager.class);for(int i=1000;i<1000+AgendaEngine.MAX_ALARMS;i++)m.cancel(alarm(c,i));m.cancel(alarm(c,REFRESH_ID));
        NotificationManagerCompat.from(c).cancelAll();PlannerStore.prefs(c).edit().remove("pending").commit();
    }
    public static void reconcile(Context c){synchronized(PlannerStore.class){reconcileLocked(c);}}
    static void reconcileLocked(Context c){
        channels(c);AlarmManager m=c.getSystemService(AlarmManager.class);for(int i=1000;i<1000+AgendaEngine.MAX_ALARMS;i++)m.cancel(alarm(c,i));
        List<AgendaEngine.Reminder> rows=AgendaEngine.reminders(PlannerStore.entries(c),PlannerStore.settings(c),Instant.now(),ZoneId.systemDefault());
        JSONArray pending=new JSONArray();for(var row:rows)try{pending.put(new JSONObject().put("id",row.id()).put("key",row.key()).put("title",row.title()).put("body",row.body()).put("at",row.at()));}catch(JSONException ignored){}
        PlannerStore.prefs(c).edit().putString("pending",pending.toString()).commit();
        // Never silently request notification permission during background sync.
        if(allowed(c))for(var row:rows)at(c,row.id(),row.at());
        long midnight=LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();if(!PlannerStore.owner(c).isEmpty())at(c,REFRESH_ID,midnight);
        summary(c);
    }
    static NotificationCompat.Builder notification(Context c,String channel,String title,String text,String key,int id){
        boolean titles=PlannerStore.settings(c).optBoolean("showTitles",true);
        Notification publicVersion=new NotificationCompat.Builder(c,channel).setSmallIcon(R.drawable.ic_planner_notification).setContentTitle("Planner").setContentText("Bạn có lịch và công việc cần xem").build();
        return new NotificationCompat.Builder(c,channel).setSmallIcon(R.drawable.ic_planner_notification).setColor(0xff0891b2).setContentTitle(title).setContentText(text).setContentIntent(open(c,key,id)).setVisibility(titles?NotificationCompat.VISIBILITY_PUBLIC:NotificationCompat.VISIBILITY_PRIVATE).setPublicVersion(publicVersion);
    }
    static void post(Context c,int id,Notification n){if(!allowed(c))return;try{NotificationManagerCompat.from(c).notify(id,n);}catch(SecurityException ignored){}}
    public static void summary(Context c){
        channels(c);if(!PlannerStore.settings(c).optBoolean("summaryEnabled")||PlannerStore.owner(c).isEmpty()){NotificationManagerCompat.from(c).cancel(SUMMARY_ID);return;}
        List<AgendaEngine.Entry> rows=PlannerStore.today(c);long completed=rows.stream().filter(AgendaEngine.Entry::completed).count();
        String count=rows.size()+" lịch/việc/bước · "+completed+" hoàn thành";
        NotificationCompat.InboxStyle style=new NotificationCompat.InboxStyle().setSummaryText(count);
        boolean show=PlannerStore.settings(c).optBoolean("showTitles",true);
        if(show)for(var row:rows.stream().limit(7).collect(Collectors.toList()))style.addLine((row.completed()?"✓ ":"• ")+(row.allDay()?"Cả ngày":Instant.ofEpochMilli(row.start()).atZone(ZoneId.systemDefault()).toLocalTime().withSecond(0))+"  "+row.title());
        else style.addLine("Mở Planner để xem chi tiết");
        post(c,SUMMARY_ID,notification(c,TODAY,"Planner · Hôm nay",count,"",SUMMARY_ID).setStyle(style).setOngoing(true).setOnlyAlertOnce(true).setShowWhen(false).build());
    }
    public static void fire(Context c,int id){
        if(id==REFRESH_ID){PlannerNotifications.reconcile(c);PlannerWidget.updateAll(c);PlannerSyncWorker.refresh(c);return;}
        try{
            JSONArray rows=new JSONArray(PlannerStore.prefs(c).getString("pending","[]"));
            for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);if(row.getInt("id")!=id)continue;
                // Ignore a stale PendingIntent delivered after rescheduling or account changes.
                if(Math.abs(System.currentTimeMillis()-row.getLong("at"))>12*60*60*1000L||row.getLong("at")>System.currentTimeMillis()+1000)return;
                post(c,id,notification(c,REMINDERS,row.getString("title"),row.getString("body"),row.getString("key"),id).setStyle(new NotificationCompat.BigTextStyle().bigText(row.getString("body"))).setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH).build());return;
            }
        }catch(JSONException ignored){}
    }
}

