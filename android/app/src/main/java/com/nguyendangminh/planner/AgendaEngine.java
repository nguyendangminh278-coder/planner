package com.nguyendangminh.planner;

import org.json.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/** Pure calendar math shared by widgets, background sync and local alarms. */
public final class AgendaEngine {
    public static final int HORIZON_DAYS=30, MAX_ALARMS=256;
    public record Entry(String key,String title,long start,long end,boolean allDay,boolean completed,String kind) {}
    public record Reminder(int id,String key,String title,String body,long at) {}
    static ZoneId zone(JSONObject row,ZoneId fallback){try{return ZoneId.of(row.optString("timeZone",fallback.getId()));}catch(Exception e){return fallback;}}
    static ZonedDateTime stamp(String value,ZoneId zone){try{return OffsetDateTime.parse(value).atZoneSameInstant(zone);}catch(Exception e){return LocalDateTime.parse(value).atZone(zone);}}
    static boolean matches(LocalDate day,LocalDate anchor,JSONObject rule){
        int interval=Math.max(1,rule.optInt("interval",1));
        return switch(rule.optString("frequency")){
            case "daily" -> ChronoUnit.DAYS.between(anchor,day)%interval==0;
            case "weekly" -> {
                LocalDate a=anchor.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),d=day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                JSONArray weekdays=rule.optJSONArray("weekdays");boolean chosen=false;
                if(weekdays!=null)for(int i=0;i<weekdays.length();i++)chosen|=weekdays.optInt(i)==day.getDayOfWeek().getValue();
                yield chosen&&ChronoUnit.WEEKS.between(a,d)%interval==0;
            }
            case "monthly" -> ChronoUnit.MONTHS.between(YearMonth.from(anchor),YearMonth.from(day))%interval==0&&
                ("weekday".equals(rule.optString("monthlyMode"))?day.getDayOfWeek()==anchor.getDayOfWeek()&&(day.getDayOfMonth()-1)/7==(anchor.getDayOfMonth()-1)/7:day.getDayOfMonth()==anchor.getDayOfMonth());
            case "yearly" -> (day.getYear()-anchor.getYear())%interval==0&&day.getMonth()==anchor.getMonth()&&day.getDayOfMonth()==anchor.getDayOfMonth();
            default -> false;
        };
    }
    public static List<Entry> expand(JSONObject source,Instant now,ZoneId viewer){
        List<Entry> result=new ArrayList<>();
        long low=now.atZone(viewer).toLocalDate().atStartOfDay(viewer).toInstant().toEpochMilli();
        long high=now.atZone(viewer).toLocalDate().plusDays(HORIZON_DAYS+1).atStartOfDay(viewer).toInstant().toEpochMilli();
        JSONArray events=source.optJSONArray("events");
        if(events!=null)for(int i=0;i<events.length();i++)try{
            JSONObject row=events.getJSONObject(i);ZoneId zone=zone(row,viewer);
            ZonedDateTime start=stamp(row.getString("start"),zone),end=stamp(row.getString("end"),zone);
            if(!end.isAfter(start))continue;
            boolean allDay=row.optBoolean("allDay");long duration=Duration.between(start,end).toMillis();
            int days=(int)Math.max(1,ChronoUnit.DAYS.between(start.toLocalDate(),end.toLocalDate()));
            JSONObject rule=row.optJSONObject("recurrence");
            if(rule==null){addEvent(result,row,start,end,allDay,days,viewer,low,high);continue;}
            LocalDate anchor=start.toLocalDate(),stop=Instant.ofEpochMilli(high).atZone(zone).toLocalDate().plusDays(2);
            LocalDate until="until".equals(rule.optString("endType"))?LocalDate.parse(rule.getString("untilDate")):stop;
            int count="count".equals(rule.optString("endType"))?rule.optInt("count",1):Integer.MAX_VALUE,seen=0;
            // COUNT needs the original anchor; unbounded series can skip to the visible range.
            LocalDate first=anchor;
            if(count==Integer.MAX_VALUE){LocalDate visible=Instant.ofEpochMilli(low).atZone(zone).toLocalDate().minusDays((duration+86399999L)/86400000L+2);if(visible.isAfter(first))first=visible;}
            for(LocalDate day=first;!day.isAfter(stop)&&!day.isAfter(until);day=day.plusDays(1)){
                if(!matches(day,anchor,rule))continue;if(++seen>count)break;
                ZonedDateTime begin=day.equals(anchor)?start:day.atTime(start.toLocalTime()).atZone(zone);
                addEvent(result,row,begin,begin.plus(Duration.ofMillis(duration)),allDay,days,viewer,low,high);
            }
        }catch(Exception ignored){}
        JSONArray tasks=source.optJSONArray("tasks");
        if(tasks!=null)for(int i=0;i<tasks.length();i++)try{
            JSONObject row=tasks.getJSONObject(i);boolean complete=row.optInt("progress")>=100;
            addTask(result,row,"tasks:"+row.getString("id"),row.getString("title"),complete,viewer,low,high);
            JSONArray steps=row.optJSONArray("steps");if(steps!=null)for(int j=0;j<steps.length();j++){
                JSONObject step=steps.getJSONObject(j);if(!step.has("timeZone"))step=new JSONObject(step.toString()).put("timeZone",row.optString("timeZone",viewer.getId()));
                addTask(result,step,"steps:"+row.getString("id")+"/"+step.getString("id"),row.getString("title")+" · "+(j+1)+". "+step.getString("title"),complete||step.optInt("progress")>=100,viewer,low,high);
            }
        }catch(Exception ignored){}
        result.sort(Comparator.comparingLong(Entry::start).thenComparing(Entry::title));return result;
    }
    static void addEvent(List<Entry> out,JSONObject row,ZonedDateTime start,ZonedDateTime end,boolean allDay,int days,ZoneId viewer,long low,long high)throws JSONException{
        long a=allDay?start.toLocalDate().atStartOfDay(viewer).toInstant().toEpochMilli():start.toInstant().toEpochMilli();
        long b=allDay?start.toLocalDate().plusDays(days).atStartOfDay(viewer).toInstant().toEpochMilli():end.toInstant().toEpochMilli();
        if(a<high&&b>low)out.add(new Entry("events:"+row.getString("id"),row.getString("title"),a,b,allDay,false,"Lịch"));
    }
    static void addTask(List<Entry> out,JSONObject row,String key,String title,boolean completed,ZoneId viewer,long low,long high){
        try{
            boolean allDay=row.optBoolean("allDay",true);ZoneId zone=zone(row,viewer);
            LocalDate start=LocalDate.parse(row.getString("start")),end=LocalDate.parse(row.getString("end"));
            long a=allDay?start.atStartOfDay(viewer).toInstant().toEpochMilli():start.atTime(LocalTime.parse(row.getString("startTime"))).atZone(zone).toInstant().toEpochMilli();
            long b=allDay?end.plusDays(1).atStartOfDay(viewer).toInstant().toEpochMilli():end.atTime(LocalTime.parse(row.getString("endTime"))).atZone(zone).toInstant().toEpochMilli();
            if(a<high&&b>low&&b>a)out.add(new Entry(key,title,a,b,allDay,completed,key.startsWith("steps:")?"Bước":"Việc"));
        }catch(Exception ignored){}
    }
    public static List<Entry> today(List<Entry> rows,Instant now,ZoneId zone){
        LocalDate date=now.atZone(zone).toLocalDate();long a=date.atStartOfDay(zone).toInstant().toEpochMilli(),b=date.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli();
        return rows.stream().filter(row->row.start<b&&row.end>a).sorted(Comparator.comparing(Entry::completed).thenComparing(row->!row.allDay).thenComparingLong(Entry::start)).collect(Collectors.toList());
    }
    public static List<Reminder> reminders(List<Entry> rows,JSONObject settings,Instant now,ZoneId zone){
        List<Reminder> out=new ArrayList<>();JSONObject rules=settings.optJSONObject("reminders");if(rules==null)return out;
        Set<String> unique=new HashSet<>();long time=now.toEpochMilli(),max=now.plus(Duration.ofDays(HORIZON_DAYS)).toEpochMilli();
        for(Entry row:rows){
            JSONObject rule=rules.optJSONObject(row.key);if(row.completed||rule==null||!rule.optBoolean("enabled"))continue;
            String custom=rule.optString("customAt","");
            try{
                if(!custom.trim().isEmpty()){long at=LocalDateTime.parse(custom).atZone(zone).toInstant().toEpochMilli();addReminder(out,unique,row,at,time,max);}
                else if(row.allDay){
                    LocalDate a=Instant.ofEpochMilli(Math.max(row.start,time)).atZone(zone).toLocalDate(),b=Instant.ofEpochMilli(row.end-1).atZone(zone).toLocalDate();
                    LocalTime clock=LocalTime.parse(rule.optString("allDayTime","09:00"));
                    // All-day work spans daily reminders; an all-day event only reminds on its first date.
                    if(row.key.startsWith("events:")){a=Instant.ofEpochMilli(row.start).atZone(zone).toLocalDate();b=a;}
                    for(LocalDate date=a;!date.isAfter(b)&&!date.isAfter(now.atZone(zone).toLocalDate().plusDays(HORIZON_DAYS));date=date.plusDays(1))addReminder(out,unique,row,date.atTime(clock).atZone(zone).toInstant().toEpochMilli(),time,max);
                }else addReminder(out,unique,row,row.start-Math.max(0,Math.min(120,rule.optInt("minutesBefore",15)))*60000L,time,max);
            }catch(Exception ignored){}
        }
        out.sort(Comparator.comparingLong(Reminder::at));if(out.size()>MAX_ALARMS)out=new ArrayList<>(out.subList(0,MAX_ALARMS));
        List<Reminder> numbered=new ArrayList<>();for(int i=0;i<out.size();i++){Reminder r=out.get(i);numbered.add(new Reminder(1000+i,r.key,r.title,r.body,r.at));}return numbered;
    }
    static void addReminder(List<Reminder> out,Set<String> seen,Entry row,long at,long low,long high){
        if(at<=low||at>high||!seen.add(row.key+"@"+at))return;
        out.add(new Reminder(0,row.key,row.title,row.kind+" · "+(row.allDay?"Cả ngày":"Bắt đầu "+Instant.ofEpochMilli(row.start).atZone(ZoneId.systemDefault()).toLocalTime().withSecond(0)),at));
    }
}

