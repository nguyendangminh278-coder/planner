package com.nguyendangminh.planner;
import android.content.*;
import android.graphics.*;
import android.view.View;
import android.widget.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class PlannerWidgetService extends RemoteViewsService {
    @Override public RemoteViewsFactory onGetViewFactory(Intent intent){return new Factory(getApplicationContext(),intent.getIntExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_ID,-1),intent.getBooleanExtra("calendar",false));}
    static class Factory implements RemoteViewsFactory {
        final Context context;final int widgetId;final boolean calendar;List<WidgetData.TaskRow> tasks=new ArrayList<>();WidgetData.ThreeDays grid;Bitmap bitmap;boolean privateTitles,logged;
        Factory(Context c,int id,boolean calendar){context=c;widgetId=id;this.calendar=calendar;}
        @Override public void onCreate(){onDataSetChanged();}
        @Override public void onDataSetChanged(){
            logged=!PlannerStore.owner(context).isEmpty();privateTitles=!PlannerStore.settings(context).optBoolean("showTitles",true);
            if(calendar){grid=WidgetData.threeDays(PlannerStore.source(context),LocalDate.now().plusDays(PlannerStore.calendarOffset(context,widgetId)),ZoneId.systemDefault());
                int width=android.appwidget.AppWidgetManager.getInstance(context).getAppWidgetOptions(widgetId).getInt(android.appwidget.AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,280);
                bitmap=logged?CalendarWidgetRenderer.renderThreeDays(grid,Math.max(150,width-28),context.getResources().getDisplayMetrics().density,context.getResources().getConfiguration().fontScale,Instant.now(),ZoneId.systemDefault(),privateTitles):null;
            }else tasks=WidgetData.tasks(PlannerStore.source(context),Instant.now(),ZoneId.systemDefault());
        }
        @Override public void onDestroy(){tasks.clear();bitmap=null;}
        @Override public int getCount(){return !logged?0:calendar?1:tasks.size();}
        @Override public RemoteViews getViewAt(int position){
            if(position<0||position>=getCount())return null;
            if(calendar){
                RemoteViews view=new RemoteViews(context.getPackageName(),R.layout.planner_widget_grid);view.setImageViewBitmap(R.id.widget_grid_image,bitmap);view.setContentDescription(R.id.widget_grid_image,"Lịch 3 ngày, "+grid.center().minusDays(1)+" đến "+grid.center().plusDays(1)+", "+grid.startHour()+" giờ đến "+grid.endHour()+" giờ. Chạm để mở lịch trong Planner.");view.setOnClickFillInIntent(R.id.widget_grid_image,new Intent().putExtra("operation","open").putExtra("recordKey","calendar:"+grid.center()));return view;
            }
            var row=tasks.get(position);return taskView(context,row,PlannerStore.taskWidgetState(context,row.id()),privateTitles);
        }
        @Override public RemoteViews getLoadingView(){return null;}
        @Override public int getViewTypeCount(){return 1;}
        @Override public long getItemId(int position){return position;}
        @Override public boolean hasStableIds(){return false;}
    }
    static RemoteViews taskView(Context c,WidgetData.TaskRow row,String state,boolean privateTitles){
        RemoteViews view=new RemoteViews(c.getPackageName(),R.layout.planner_widget_task_row);boolean pending=state.equals("pending");
        view.setTextViewText(R.id.widget_task_title,privateTitles?"Công việc (ẩn tên)":row.title());view.setInt(R.id.widget_task_title,"setPaintFlags",Paint.ANTI_ALIAS_FLAG|(row.completed()?Paint.STRIKE_THRU_TEXT_FLAG:0));view.setTextColor(R.id.widget_task_title,row.completed()?0xff94a3b8:0xff164e63);
        String summary=privateTitles?"Mở Planner để xem nội dung":row.summary();if(summary.isEmpty())summary="Chạm vào việc để xem chi tiết";
        if(pending)summary="Đang chờ đồng bộ…";if(state.equals("error"))summary="Chưa lưu được, chạm ô tick để thử lại.";
        view.setTextViewText(R.id.widget_task_summary,summary);view.setTextColor(R.id.widget_task_summary,state.equals("error")?0xffdc2626:0xff64748b);
        DateTimeFormatter clock=DateTimeFormatter.ofPattern("HH:mm"),date=DateTimeFormatter.ofPattern("dd/MM");ZoneId zone=ZoneId.systemDefault();
        String time=row.allDay()?"Cả ngày · hạn "+Instant.ofEpochMilli(row.end()-1).atZone(zone).format(date):Instant.ofEpochMilli(row.start()).atZone(zone).format(clock)+"–"+Instant.ofEpochMilli(row.end()).atZone(zone).format(clock);
        view.setTextViewText(R.id.widget_task_time,time+(row.completed()?" · Đã hoàn thành":""));
        view.setImageViewResource(R.id.widget_task_tick,row.completed()?R.drawable.ic_widget_checked:R.drawable.ic_widget_unchecked);
        view.setContentDescription(R.id.widget_task_tick,pending?"Đang chờ lưu công việc":(row.completed()?"Bỏ hoàn thành: ":"Hoàn thành: ")+(privateTitles?"Công việc":row.title()));
        view.setOnClickFillInIntent(R.id.widget_task_tick,new Intent().putExtra("operation","toggle").putExtra("recordKey","tasks:"+row.id()).putExtra("completed",row.completed()));
        view.setOnClickFillInIntent(R.id.widget_task_body,new Intent().putExtra("operation","open").putExtra("recordKey","tasks:"+row.id()));
        view.setInt(R.id.widget_task_row,"setBackgroundResource",row.completed()?R.drawable.planner_widget_done_background:R.drawable.planner_widget_row_background);return view;
    }
}
