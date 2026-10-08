package com.nguyendangminh.planner;
import android.content.*;
public class PlannerRefreshReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){if(!PlannerStore.owner(context).isEmpty()){PlannerNotifications.reconcile(context);PlannerWidget.updateAll(context);PlannerSyncWorker.refresh(context);}}
}

