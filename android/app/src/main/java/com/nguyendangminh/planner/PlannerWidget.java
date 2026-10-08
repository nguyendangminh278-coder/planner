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
    public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(Class<?> cls:new Class<?>[]{PlannerWidget.class,PlannerCompactWidget.class}){for(int id:m.getAppWidgetIds(new ComponentName(c,cls)))render(c,m,id,cls==PlannerCompactWidget.class);}}
    @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)render(c,m,id,this instanceof PlannerCompactWidget);PlannerSyncWorker.schedule(c);}
    @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){render(c,m,id,this instanceof PlannerCompactWidget);}
    static void render(Context c,AppWidgetManager manager,int id,boolean calendar){
        boolean logged=!PlannerStore.owner(c).isEmpty();var source=PlannerStore.source(c);Instant now=Instant.now();ZoneId zone=ZoneId.systemDefault();
        LocalDate center=LocalDate.now().plusDays(PlannerStore.calendarOffset(c,id));WidgetData.ThreeDays window=calendar?WidgetData.threeDays(source,center,zone):null;
        int count=calendar?window.days().stream().mapToInt(day->day.timed().size()+day.allDay().size()).sum():WidgetData.tasks(source,now,zone).size();
        RemoteViews view=new RemoteViews(c.getPackageName(),calendar?R.layout.planner_widget_compact:R.layout.planner_widget);
        view.setTextViewText(R.id.widget_heading,calendar?center.format(DateTimeFormatter.ofPattern("dd/MM"))+" · 3 ngày":"Công việc · "+LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM")));
        view.setTextViewText(R.id.widget_empty,logged?(calendar?"Hôm nay chưa có lịch":"Chưa có công việc đến ngày") : "Mở Planner để đăng nhập");
        String updated=PlannerStore.updated(c)>0?"Cập nhật "+Instant.ofEpochMilli(PlannerStore.updated(c)).atZone(zone).format(DateTimeFormatter.ofPattern("dd/MM HH:mm")):"Chưa đồng bộ";
        view.setTextViewText(R.id.widget_status,updated+" · "+count+(calendar?" lịch":" việc"));
        String openKey=calendar?"calendar:"+center:"tasks:today";
        view.setOnClickPendingIntent(R.id.widget_heading,PlannerNotifications.open(c,openKey,id));view.setOnClickPendingIntent(R.id.widget_status,PlannerNotifications.open(c,openKey,id));
        if(calendar){for(String operation:new String[]{"previous","next","today"}){Intent nav=new Intent(c,PlannerWidgetActionReceiver.class).setAction("planner.WIDGET_NAV_"+operation).putExtra("widgetId",id).putExtra("operation",operation);int target=operation.equals("previous")?R.id.widget_previous:operation.equals("next")?R.id.widget_next:R.id.widget_today;view.setOnClickPendingIntent(target,PendingIntent.getBroadcast(c,id,nav,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));}}
        Intent adapter=new Intent(c,PlannerWidgetService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,id).putExtra("calendar",calendar);adapter.setData(Uri.parse("planner://widget/"+(calendar?"calendar/":"tasks/")+id));
        view.setRemoteAdapter(R.id.widget_list,adapter);view.setEmptyView(R.id.widget_list,R.id.widget_empty);
        Intent action=new Intent(c,PlannerWidgetActionReceiver.class).setAction("planner.WIDGET_ACTION").putExtra("widgetId",id);
        view.setPendingIntentTemplate(R.id.widget_list,PendingIntent.getBroadcast(c,id,action,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_MUTABLE));
        manager.updateAppWidget(id,view);manager.notifyAppWidgetViewDataChanged(id,R.id.widget_list);
    }
}
