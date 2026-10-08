package com.nguyendangminh.planner;
import android.graphics.*;
import android.text.*;
import java.time.*;
import java.time.format.DateTimeFormatter;

/** One continuous bitmap keeps event duration and overlap lanes intact while the widget scrolls. */
public final class CalendarWidgetRenderer {
    public static Bitmap renderThreeDays(WidgetData.ThreeDays model,float widthDp,float density,float fontScale,Instant now,ZoneId zone,boolean privateTitles){
        float hour=58,gutter=38,header=38,allDay=model.days().stream().anyMatch(day->!day.allDay().isEmpty())?64:0,top=header+allDay,heightDp=top+(model.endHour()-model.startHour())*hour+20;
        float scale=Math.min(density,(float)Math.sqrt(1800000.0/(widthDp*heightDp))),column=(widthDp-gutter)/3;
        Bitmap bitmap=Bitmap.createBitmap(Math.max(1,(int)Math.ceil(widthDp*scale)),Math.max(1,(int)Math.ceil(heightDp*scale)),Bitmap.Config.ARGB_8888);
        Canvas canvas=new Canvas(bitmap);canvas.scale(scale,scale);canvas.drawColor(0xfff8fdfe);Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);TextPaint text=new TextPaint(Paint.ANTI_ALIAS_FLAG);
        LocalDate today=now.atZone(zone).toLocalDate();DateTimeFormatter clock=DateTimeFormatter.ofPattern("HH:mm"),date=DateTimeFormatter.ofPattern("dd/MM");
        for(int day=0;day<3;day++){
            float x=gutter+day*column;LocalDate value=model.center().plusDays(day-1);
            if(value.equals(today)){paint.setColor(0xffecfeff);canvas.drawRect(x,0,x+column,heightDp,paint);}
            text.setColor(value.equals(today)?0xff0891b2:0xff64748b);text.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));text.setTextSize(11*Math.min(1.4f,fontScale));canvas.drawText(value.format(date),x+4,15,text);
            text.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));text.setTextSize(9*Math.min(1.4f,fontScale));String name=value.equals(today)?"Hôm nay":value.getDayOfWeek().getValue()==7?"CN":"T"+(value.getDayOfWeek().getValue()+1);canvas.drawText(name,x+4,29,text);
            paint.setColor(0xffdbe8ed);paint.setStrokeWidth(.6f);canvas.drawLine(x,0,x,heightDp,paint);
            var data=model.days().get(day);
            if(allDay>0){int count=0;text.setTextSize(9*Math.min(1.4f,fontScale));text.setColor(0xff155e75);for(var event:data.allDay()){if(count>=3)break;canvas.drawText(TextUtils.ellipsize(privateTitles?"Cả ngày":event.title(),text,column-8,TextUtils.TruncateAt.END).toString(),x+4,header+13+count*16,text);count++;}}
            for(var slot:data.timed()){
                float lane=column/slot.lanes(),left=x+slot.lane()*lane+2,right=left+lane-4,y=top+(float)(slot.startMinute()/60-model.startHour())*hour,bottom=top+(float)(slot.endMinute()/60-model.startHour())*hour;
                RectF rect=new RectF(left,y,right,bottom);paint.setColor(slot.color());canvas.drawRoundRect(rect,4,4,paint);canvas.save();canvas.clipRect(rect);
                if(right-left>10&&bottom-y>16){
                    text.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));text.setTextSize(10*Math.min(1.4f,fontScale));text.setColor(0xff164e63);
                    String title=privateTitles?"Lịch":slot.event().title();int maxLines=bottom-y>36?2:1;
                    StaticLayout label=StaticLayout.Builder.obtain(title,0,title.length(),text,Math.max(1,(int)(right-left-6))).setMaxLines(maxLines).setEllipsize(TextUtils.TruncateAt.END).setIncludePad(false).build();
                    canvas.save();canvas.translate(left+3,y+4);label.draw(canvas);canvas.restore();
                    text.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));text.setTextSize(8*Math.min(1.4f,fontScale));float baseline=y+label.getHeight()+text.getTextSize()+7;
                    if(baseline<bottom-3){String time=Instant.ofEpochMilli(slot.event().start()).atZone(zone).format(clock)+"–"+Instant.ofEpochMilli(slot.event().end()).atZone(zone).format(clock);canvas.drawText(TextUtils.ellipsize(time,text,right-left-6,TextUtils.TruncateAt.END).toString(),left+3,baseline,text);}
                }canvas.restore();
            }
        }
        text.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));text.setTextSize(9*Math.min(1.4f,fontScale));text.setColor(0xff64748b);paint.setStrokeWidth(.6f);
        for(int h=model.startHour();h<=model.endHour();h++){float y=top+(h-model.startHour())*hour;paint.setColor(0xffdbe8ed);canvas.drawLine(gutter,y,widthDp,y,paint);canvas.drawText(String.format(java.util.Locale.ROOT,"%02d:00",h),0,Math.min(heightDp-2,y+10),text);if(h<model.endHour()){paint.setColor(0xffedf2f6);canvas.drawLine(gutter,y+hour/2,widthDp,y+hour/2,paint);}}
        int todayColumn=(int)java.time.temporal.ChronoUnit.DAYS.between(model.center().minusDays(1),today);if(todayColumn>=0&&todayColumn<3){ZonedDateTime time=now.atZone(zone);float y=top+(time.getHour()+time.getMinute()/60f-model.startHour())*hour;if(y>=top&&y<heightDp-10){paint.setColor(0xfff43f5e);paint.setStrokeWidth(1.1f);canvas.drawLine(gutter+todayColumn*column,y,gutter+(todayColumn+1)*column,y,paint);}}
        return bitmap;
    }
    public static Bitmap render(WidgetData.CalendarGrid grid,float widthDp,float density,float fontScale,Instant now,ZoneId zone,boolean privateTitles){
        float hour=58,gutter=42,heightDp=(grid.endHour()-grid.startHour())*hour+20;
        float scale=Math.min(density,(float)Math.sqrt(1800000.0/(widthDp*heightDp)));
        Bitmap bitmap=Bitmap.createBitmap(Math.max(1,(int)Math.ceil(widthDp*scale)),Math.max(1,(int)Math.ceil(heightDp*scale)),Bitmap.Config.ARGB_8888);
        Canvas canvas=new Canvas(bitmap);canvas.scale(scale,scale);canvas.drawColor(0xfff8fdfe);
        Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);TextPaint text=new TextPaint(Paint.ANTI_ALIAS_FLAG);text.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));text.setTextSize(10*Math.min(1.5f,fontScale));
        for(int h=grid.startHour();h<=grid.endHour();h++){
            float y=10+(h-grid.startHour())*hour;paint.setColor(0xffdbe8ed);paint.setStrokeWidth(.65f);canvas.drawLine(gutter,y,widthDp,y,paint);
            text.setColor(0xff64748b);canvas.drawText(String.format(java.util.Locale.ROOT,"%02d:00",h),1,Math.min(heightDp-2,y+10),text);
            if(h<grid.endHour()){paint.setColor(0xffeef4f6);canvas.drawLine(gutter,y+hour/2,widthDp,y+hour/2,paint);}
        }
        DateTimeFormatter clock=DateTimeFormatter.ofPattern("HH:mm");
        for(var slot:grid.timed()){
            float laneWidth=(widthDp-gutter-5)/slot.lanes(),left=gutter+4+slot.lane()*laneWidth,right=left+laneWidth-4;
            float top=10+(float)(slot.startMinute()/60-grid.startHour())*hour,bottom=10+(float)(slot.endMinute()/60-grid.startHour())*hour;
            RectF rect=new RectF(left,top,right,bottom);paint.setColor(slot.color());canvas.drawRoundRect(rect,6,6,paint);
            canvas.save();canvas.clipRect(rect);float available=right-left-10;
            if(available>8&&bottom-top>=17){
                text.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));text.setTextSize(12*Math.min(1.5f,fontScale));text.setColor(0xff164e63);
                String title=privateTitles?"Lịch (ẩn tên)":slot.event().title();float y=top+text.getTextSize()+5;
                CharSequence label=TextUtils.ellipsize(title,text,available,TextUtils.TruncateAt.END);canvas.drawText(label.toString(),left+5,y,text);
                text.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));text.setTextSize(10*Math.min(1.5f,fontScale));text.setColor(0xff475569);y+=text.getTextSize()+5;
                if(y<bottom-3){String time=Instant.ofEpochMilli(slot.event().start()).atZone(zone).format(clock)+"–"+Instant.ofEpochMilli(slot.event().end()).atZone(zone).format(clock);canvas.drawText(TextUtils.ellipsize(time,text,available,TextUtils.TruncateAt.END).toString(),left+5,y,text);}
            }canvas.restore();
        }
        ZonedDateTime time=now.atZone(zone);float y=10+(time.getHour()+time.getMinute()/60f-grid.startHour())*hour;
        if(y>=10&&y<=heightDp-10){paint.setColor(0xfff43f5e);paint.setStrokeWidth(1.1f);canvas.drawLine(gutter,y,widthDp,y,paint);canvas.drawCircle(gutter,y,2.5f,paint);}
        return bitmap;
    }
}
