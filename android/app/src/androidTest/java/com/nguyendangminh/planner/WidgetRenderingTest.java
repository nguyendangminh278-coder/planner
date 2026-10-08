package com.nguyendangminh.planner;
import android.content.Context;
import android.graphics.*;
import android.view.View;
import android.widget.*;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.*;
import org.junit.runner.RunWith;
import org.json.*;
import java.time.*;
import java.util.*;
import java.io.*;
import static org.junit.Assert.*;

/** Off-screen native rendering; never changes the user's tasks or places a widget. */
@RunWith(AndroidJUnit4.class)
public class WidgetRenderingTest {
    final Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
    final Instant now=Instant.parse("2026-10-08T03:00:00Z");final ZoneId zone=ZoneId.of("Asia/Bangkok");
    void save(Bitmap bitmap,String name)throws Exception{File folder=new File(context.getCacheDir(),"widget-previews");folder.mkdirs();try(FileOutputStream stream=new FileOutputStream(new File(folder,name))){bitmap.compress(Bitmap.CompressFormat.PNG,100,stream);}}
    @Test public void hourGridRendersContinuousDurationsWithinBitmapBudget()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[{\"id\":\"a\",\"title\":\"Lịch buổi sáng\",\"start\":\"2026-10-08T09:00:00+07:00\",\"end\":\"2026-10-08T11:30:00+07:00\",\"color\":\"#cffafe\"},{\"id\":\"b\",\"title\":\"Lịch buổi chiều\",\"start\":\"2026-10-08T13:30:00+07:00\",\"end\":\"2026-10-08T17:30:00+07:00\",\"color\":\"#d1fae5\"}],\"tasks\":[]}");
        Bitmap bitmap=CalendarWidgetRenderer.render(WidgetData.calendar(source,now,zone),300,context.getResources().getDisplayMetrics().density,1,now,zone,false);assertTrue(bitmap.getWidth()>0);assertTrue(bitmap.getHeight()>bitmap.getWidth());assertTrue(bitmap.getByteCount()<7500000);save(bitmap,"calendar-grid.png");
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{RemoteViews remote=new RemoteViews(context.getPackageName(),R.layout.planner_widget_grid);remote.setImageViewBitmap(R.id.widget_grid_image,bitmap);View applied=remote.apply(context,new FrameLayout(context));assertTrue(applied instanceof ImageView);assertNotNull(((ImageView)applied).getDrawable());});
    }
    @Test public void taskCheckboxAndShortDescriptionInflateAsNativeRemoteViews()throws Exception{
        Bitmap[] result=new Bitmap[1];InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{
            WidgetData.TaskRow row=new WidgetData.TaskRow("preview","Hoàn thiện tài liệu","Chuẩn bị nội dung, rà soát và gửi tài liệu.",now.toEpochMilli(),now.plusSeconds(7200).toEpochMilli(),false,false,30);
            RemoteViews remote=PlannerWidgetService.taskView(context,row,"",false);View view=remote.apply(context,new FrameLayout(context));assertEquals("Hoàn thiện tài liệu",((TextView)view.findViewById(R.id.widget_task_title)).getText().toString());assertNotNull(view.findViewById(R.id.widget_task_tick));
            int width=(int)(300*context.getResources().getDisplayMetrics().density);view.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(0,View.MeasureSpec.UNSPECIFIED));view.layout(0,0,width,view.getMeasuredHeight());result[0]=Bitmap.createBitmap(width,view.getMeasuredHeight(),Bitmap.Config.ARGB_8888);view.draw(new Canvas(result[0]));
        });save(result[0],"task-row.png");
    }
    @Test public void threeDayGridAndNavigationControlsInflate()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[{\"id\":\"a\",\"title\":\"Chuẩn bị tài liệu\",\"start\":\"2026-10-07T09:00:00+07:00\",\"end\":\"2026-10-07T11:00:00+07:00\"},{\"id\":\"b\",\"title\":\"Họp nhóm\",\"start\":\"2026-10-08T10:00:00+07:00\",\"end\":\"2026-10-08T12:00:00+07:00\"},{\"id\":\"c\",\"title\":\"Lịch ngày mai\",\"start\":\"2026-10-09T13:30:00+07:00\",\"end\":\"2026-10-09T15:30:00+07:00\"}],\"tasks\":[]}");
        Bitmap bitmap=CalendarWidgetRenderer.renderThreeDays(WidgetData.threeDays(source,LocalDate.parse("2026-10-08"),zone),300,context.getResources().getDisplayMetrics().density,1,now,zone,false);assertTrue(bitmap.getByteCount()<7500000);save(bitmap,"calendar-three-days.png");
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{RemoteViews remote=new RemoteViews(context.getPackageName(),R.layout.planner_widget_compact);View view=remote.apply(context,new FrameLayout(context));assertNotNull(view.findViewById(R.id.widget_next));assertNotNull(view.findViewById(R.id.widget_previous));assertNotNull(view.findViewById(R.id.widget_today));});
    }
}
