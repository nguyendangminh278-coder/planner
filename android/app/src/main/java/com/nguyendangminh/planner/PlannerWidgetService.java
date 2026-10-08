package com.nguyendangminh.planner;
import android.app.KeyguardManager;
import android.content.*;
import android.graphics.Paint;
import android.widget.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class PlannerWidgetService extends RemoteViewsService {
    @Override public RemoteViewsFactory onGetViewFactory(Intent intent){return new Factory(getApplicationContext());}
    static class Factory implements RemoteViewsFactory {
        final Context context;List<AgendaEngine.Entry> rows=new ArrayList<>();boolean privateTitles;
        Factory(Context c){context=c;}
        @Override public void onCreate(){onDataSetChanged();}
        @Override public void onDataSetChanged(){rows=PlannerStore.today(context);privateTitles=!PlannerStore.settings(context).optBoolean("showTitles",true);}
        @Override public void onDestroy(){rows.clear();}
        @Override public int getCount(){return rows.size();}
        @Override public RemoteViews getViewAt(int position){
            if(position>=rows.size())return null;var row=rows.get(position);RemoteViews view=new RemoteViews(context.getPackageName(),R.layout.planner_widget_row);
            view.setTextViewText(R.id.widget_row_title,privateTitles?row.kind()+" (ẩn tên)":row.title());
            view.setInt(R.id.widget_row_title,"setPaintFlags",Paint.ANTI_ALIAS_FLAG|(row.completed()?Paint.STRIKE_THRU_TEXT_FLAG:0));view.setTextColor(R.id.widget_row_title,row.completed()?0xff94a3b8:0xff164e63);
            String time=row.allDay()?"Cả ngày":Instant.ofEpochMilli(row.start()).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"))+"–"+Instant.ofEpochMilli(row.end()).atZone(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm"));
            view.setTextViewText(R.id.widget_row_time,(row.completed()?"✓ ":"• ")+row.kind()+" · "+time);
            view.setOnClickFillInIntent(R.id.widget_row,new Intent().putExtra("recordKey",row.key()));return view;
        }
        @Override public RemoteViews getLoadingView(){return null;}
        @Override public int getViewTypeCount(){return 1;}
        @Override public long getItemId(int position){return position;}
        @Override public boolean hasStableIds(){return false;}
    }
}

