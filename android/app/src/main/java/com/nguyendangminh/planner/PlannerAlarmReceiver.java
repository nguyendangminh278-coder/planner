package com.nguyendangminh.planner;
import android.content.*;
public class PlannerAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){PlannerNotifications.fire(context,intent.getIntExtra("id",-1));}
}

