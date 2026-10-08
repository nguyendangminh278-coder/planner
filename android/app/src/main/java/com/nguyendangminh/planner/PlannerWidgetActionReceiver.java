package com.nguyendangminh.planner;
import android.app.*;
import android.appwidget.AppWidgetManager;
import android.content.*;
import android.os.Build;
import android.widget.Toast;
import com.google.firebase.auth.FirebaseAuth;
import org.json.*;
import java.util.Arrays;

public class PlannerWidgetActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c,Intent intent){
        int widgetId=intent.getIntExtra("widgetId",-1);var info=AppWidgetManager.getInstance(c).getAppWidgetInfo(widgetId);
        if(info==null||!c.getPackageName().equals(info.provider.getPackageName()))return;
        String operation=intent.getStringExtra("operation"),key=intent.getStringExtra("recordKey");
        if(Arrays.asList("previous","next","today").contains(operation)){if(info.provider.getClassName().equals(PlannerCompactWidget.class.getName())){int offset=PlannerStore.calendarOffset(c,widgetId);PlannerStore.calendarOffset(c,widgetId,operation.equals("today")?0:offset+(operation.equals("next")?1:-1));}return;}
        if(!"toggle".equals(operation)){open(c,key==null?"tasks:today":key,widgetId);return;}
        if(c.getSystemService(KeyguardManager.class).isKeyguardLocked()){Toast.makeText(c,"Mở khóa điện thoại để tick hoàn thành.",Toast.LENGTH_SHORT).show();return;}
        if(key==null||!key.startsWith("tasks:")||key.length()<=6||key.substring(6).contains("/"))return;
        String uid=PlannerStore.owner(c),id=key.substring(6);PlannerStore.firebase(c);var user=FirebaseAuth.getInstance().getCurrentUser();
        if(uid.isEmpty()||user==null||!uid.equals(user.getUid())){Toast.makeText(c,"Mở Planner và đăng nhập Google để tick công việc.",Toast.LENGTH_SHORT).show();return;}
        if(PlannerStore.taskWidgetState(c,id).equals("pending"))return;
        JSONArray rows=PlannerStore.source(c).optJSONArray("tasks");if(rows==null)return;
        for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row!=null&&id.equals(row.optString("id"))){WidgetTaskWorker.enqueue(c,uid,id,!intent.getBooleanExtra("completed",false));return;}}
    }
    static void open(Context c,String key,int widgetId){
        try{
            Intent open=new Intent(c,MainActivity.class).setAction("planner.OPEN").putExtra("recordKey",key).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
            // This receiver runs only after a user's widget click; opt in for this explicit activity.
            PendingIntent target;
            if(Build.VERSION.SDK_INT>=35){ActivityOptions creator=ActivityOptions.makeBasic();creator.setPendingIntentCreatorBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);target=PendingIntent.getActivity(c,widgetId,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE,creator.toBundle());}
            else target=PendingIntent.getActivity(c,widgetId,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            if(Build.VERSION.SDK_INT>=34){ActivityOptions options=ActivityOptions.makeBasic();options.setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);target.send(c,0,null,null,null,null,options.toBundle());}
            else target.send();
        }catch(PendingIntent.CanceledException ignored){}
    }
}
