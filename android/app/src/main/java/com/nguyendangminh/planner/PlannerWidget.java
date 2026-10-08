package com.nguyendangminh.planner;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.os.Bundle;
import android.net.Uri;
import android.widget.RemoteViews;
import java.time.*;
import java.time.format.DateTimeFormatter;

public class PlannerWidget extends AppWidgetProvider {
    public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(Class<?> cls:new Class<?>[]{PlannerWidget.class,PlannerCompactWidget.class}){int[] ids=m.getAppWidgetIds(new ComponentName(c,cls));for(int id:ids)render(c,m,id,cls==PlannerCompactWidget.class);}}
    @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)render(c,m,id,this instanceof PlannerCompactWidget);PlannerSyncWorker.schedule(c);}
    @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){render(c,m,id,this instanceof PlannerCompactWidget);}
    static void render(Context c,AppWidgetManager manager,int id,boolean compact){
        var rows=PlannerStore.today(c);boolean logged=!PlannerStore.owner(c).isEmpty();
        RemoteViews view=new RemoteViews(c.getPackageName(),compact?R.layout.planner_widget_compact:R.layout.planner_widget);
        view.setTextViewText(R.id.widget_heading,"Planner · "+LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM")));
        view.setTextViewText(R.id.widget_empty,logged?"Hôm nay chưa có lịch/việc":"Mở Planner để đăng nhập");
        String updated=PlannerStore.updated(c)>0?"Cập nhật "+Instant.ofEpochMilli(PlannerStore.updated(c)).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("dd/MM HH:mm")):"Chưa đồng bộ";
        view.setTextViewText(R.id.widget_status,updated+" · "+rows.size()+" mục");
        view.setOnClickPendingIntent(R.id.widget_heading,PlannerNotifications.open(c,"",id));
        view.setOnClickPendingIntent(R.id.widget_status,PlannerNotifications.open(c,"",id));
        Intent adapter=new Intent(c,PlannerWidgetService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,id);adapter.setData(Uri.parse("planner://widget/"+id));view.setRemoteAdapter(R.id.widget_list,adapter);view.setEmptyView(R.id.widget_list,R.id.widget_empty);
        Intent open=new Intent(c,MainActivity.class).setAction("planner.OPEN").addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        view.setPendingIntentTemplate(R.id.widget_list,PendingIntent.getActivity(c,id,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_MUTABLE));
        manager.updateAppWidget(id,view);manager.notifyAppWidgetViewDataChanged(id,R.id.widget_list);
    }
}

