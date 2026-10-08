package com.nguyendangminh.planner;
import org.json.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/** Widget projections contain roots in the work list and only events in the time grid. */
public final class WidgetData {
    public record TaskRow(String id,String title,String summary,long start,long end,boolean allDay,boolean completed,int progress) {}
    public record GridEvent(AgendaEngine.Entry event,double startMinute,double endMinute,int color,int lane,int lanes) {}
    public record CalendarGrid(List<AgendaEngine.Entry> allDay,List<GridEvent> timed,int startHour,int endHour) {}
    public record ThreeDays(LocalDate center,List<CalendarGrid> days,int startHour,int endHour) {}
    public static ThreeDays threeDays(JSONObject source,LocalDate center,ZoneId zone){
        List<CalendarGrid> days=new ArrayList<>();int first=8,last=20;
        for(int i=-1;i<=1;i++){CalendarGrid grid=calendar(source,center.plusDays(i).atTime(12,0).atZone(zone).toInstant(),zone);days.add(grid);first=Math.min(first,grid.startHour());last=Math.max(last,grid.endHour());}
        return new ThreeDays(center,days,first,last);
    }
    public static String summary(String text){String value=text==null?"":text.replaceAll("\\s+"," ").trim();int count=value.codePointCount(0,value.length());return count>140?value.substring(0,value.offsetByCodePoints(0,140))+"…":value;}
    public static List<TaskRow> tasks(JSONObject source,Instant now,ZoneId zone){
        List<TaskRow> rows=new ArrayList<>();JSONArray tasks=source.optJSONArray("tasks");if(tasks==null)return rows;
        long high=now.atZone(zone).toLocalDate().plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli();
        for(int i=0;i<tasks.length();i++)try{
            JSONObject row=tasks.getJSONObject(i);List<AgendaEngine.Entry> entry=new ArrayList<>();
            AgendaEngine.addTask(entry,row,"tasks:"+row.getString("id"),row.getString("title"),row.optInt("progress")>=100,zone,Long.MIN_VALUE,Long.MAX_VALUE);
            if(entry.isEmpty()||entry.get(0).start()>=high)continue;var item=entry.get(0);
            rows.add(new TaskRow(row.getString("id"),item.title(),summary(row.optString("summary","")),item.start(),item.end(),item.allDay(),item.completed(),row.optInt("progress")));
        }catch(Exception ignored){}
        // Ticking must not move the row out of the currently visible part of the widget.
        rows.sort(Comparator.comparingLong(TaskRow::end).thenComparing(TaskRow::title));return rows;
    }
    public static CalendarGrid calendar(JSONObject source,Instant now,ZoneId zone){
        List<AgendaEngine.Entry> events=AgendaEngine.today(AgendaEngine.expand(source,now,zone),now,zone).stream().filter(row->row.key().startsWith("events:")).collect(Collectors.toList());
        List<AgendaEngine.Entry> allDay=events.stream().filter(AgendaEngine.Entry::allDay).collect(Collectors.toList());
        LocalDate date=now.atZone(zone).toLocalDate();long low=date.atStartOfDay(zone).toInstant().toEpochMilli(),high=date.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli();
        List<GridEvent> slots=new ArrayList<>();Map<String,Integer> colors=new HashMap<>();JSONArray originals=source.optJSONArray("events");
        if(originals!=null)for(int i=0;i<originals.length();i++)try{JSONObject row=originals.getJSONObject(i);String color=row.optString("color","");if(color.matches("#[0-9a-fA-F]{6}"))colors.put("events:"+row.getString("id"),(int)(0xff000000L|Long.parseLong(color.substring(1),16)));}catch(Exception ignored){}
        for(var event:events){if(event.allDay())continue;
            long a=Math.max(low,event.start()),b=Math.min(high,event.end());ZonedDateTime start=Instant.ofEpochMilli(a).atZone(zone),end=Instant.ofEpochMilli(b).atZone(zone);
            double from=a==low?0:start.getHour()*60+start.getMinute()+start.getSecond()/60.0,to=b==high?1440:end.getHour()*60+end.getMinute()+end.getSecond()/60.0;
            if(to<=from)to=Math.min(1440,from+(b-a)/60000.0);
            if(to>from)slots.add(new GridEvent(event,from,to,colors.getOrDefault(event.key(),0xffcffafe),0,1));
        }
        slots.sort(Comparator.comparingDouble(GridEvent::startMinute).thenComparingDouble(GridEvent::endMinute));
        List<GridEvent> laid=new ArrayList<>();int at=0;
        while(at<slots.size()){
            int finish=at+1;double end=slots.get(at).endMinute();while(finish<slots.size()&&slots.get(finish).startMinute()<end){end=Math.max(end,slots.get(finish).endMinute());finish++;}
            List<Double> laneEnds=new ArrayList<>();List<GridEvent> cluster=new ArrayList<>();
            for(int i=at;i<finish;i++){GridEvent slot=slots.get(i);int lane=0;while(lane<laneEnds.size()&&laneEnds.get(lane)>slot.startMinute())lane++;if(lane==laneEnds.size())laneEnds.add(slot.endMinute());else laneEnds.set(lane,slot.endMinute());cluster.add(new GridEvent(slot.event(),slot.startMinute(),slot.endMinute(),slot.color(),lane,0));}
            for(var slot:cluster)laid.add(new GridEvent(slot.event(),slot.startMinute(),slot.endMinute(),slot.color(),slot.lane(),laneEnds.size()));at=finish;
        }
        int first=8,last=20;for(var slot:laid){first=Math.min(first,(int)Math.floor(slot.startMinute()/60));last=Math.max(last,(int)Math.ceil(slot.endMinute()/60));}
        return new CalendarGrid(allDay,laid,Math.max(0,first),Math.min(24,last));
    }
}
