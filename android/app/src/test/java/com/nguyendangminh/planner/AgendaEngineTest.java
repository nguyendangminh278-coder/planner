package com.nguyendangminh.planner;
import org.junit.Test;
import static org.junit.Assert.*;
import org.json.*;
import java.time.*;
import java.util.*;
public class AgendaEngineTest {
    final ZoneId zone=ZoneId.of("Asia/Bangkok");final Instant now=Instant.parse("2026-10-08T01:00:00Z");
    JSONObject source(String events,String tasks)throws Exception{return new JSONObject("{\"events\":"+events+",\"tasks\":"+tasks+"}");}
    JSONObject options(String key,String fields)throws Exception{return new JSONObject("{\"reminders\":{\""+key+"\":{\"enabled\":true,"+fields+"}}}");}
    @Test public void overnightAndAllDayDatesIntersectToday()throws Exception{
        var rows=AgendaEngine.expand(source("[{\"id\":\"night\",\"title\":\"Night\",\"start\":\"2026-10-07T23:00:00+07:00\",\"end\":\"2026-10-08T02:00:00+07:00\"}]","[{\"id\":\"task\",\"title\":\"Task\",\"start\":\"2026-10-08\",\"end\":\"2026-10-08\"}]"),now,zone);
        assertEquals(2,AgendaEngine.today(rows,now,zone).size());assertEquals(0,AgendaEngine.today(rows,Instant.parse("2026-10-09T01:00:00Z"),zone).size());
    }
    @Test public void weeklyCountStartsAtOriginalAnchor()throws Exception{
        var data=source("[{\"id\":\"weekly\",\"title\":\"Weekly\",\"start\":\"2026-10-01T09:00:00+07:00\",\"end\":\"2026-10-01T10:00:00+07:00\",\"timeZone\":\"Asia/Bangkok\",\"recurrence\":{\"frequency\":\"weekly\",\"interval\":1,\"weekdays\":[4],\"endType\":\"count\",\"count\":2}}]","[]");
        var rows=AgendaEngine.expand(data,now,zone);assertEquals(1,rows.size());assertEquals("2026-10-08",Instant.ofEpochMilli(rows.get(0).start()).atZone(zone).toLocalDate().toString());
        assertEquals(0,AgendaEngine.expand(data,now.plus(Duration.ofDays(8)),zone).size());
    }
    @Test public void monthlyDoesNotInventDay31AndFifthWeekday()throws Exception{
        JSONObject date=new JSONObject("{\"frequency\":\"monthly\",\"interval\":1,\"monthlyMode\":\"date\"}"),weekday=new JSONObject("{\"frequency\":\"monthly\",\"interval\":1,\"monthlyMode\":\"weekday\"}");
        assertFalse(AgendaEngine.matches(LocalDate.parse("2026-02-28"),LocalDate.parse("2026-01-31"),date));assertTrue(AgendaEngine.matches(LocalDate.parse("2026-05-30"),LocalDate.parse("2026-01-31"),weekday));assertFalse(AgendaEngine.matches(LocalDate.parse("2026-02-28"),LocalDate.parse("2026-01-31"),weekday));
    }
    @Test public void completingParentCancelsAllStepReminders()throws Exception{
        var rows=AgendaEngine.expand(source("[]","[{\"id\":\"t\",\"title\":\"Task\",\"start\":\"2026-10-08\",\"end\":\"2026-10-10\",\"progress\":100,\"steps\":[{\"id\":\"s\",\"title\":\"Step\",\"start\":\"2026-10-08\",\"end\":\"2026-10-09\",\"progress\":0}]}]"),now,zone);
        assertTrue(rows.stream().allMatch(AgendaEngine.Entry::completed));assertEquals(0,AgendaEngine.reminders(rows,options("steps:t/s","\"allDayTime\":\"09:00\""),now,zone).size());
    }
    @Test public void allDayTasksRemindDailyUntilInclusiveEndButNotAfterDelete()throws Exception{
        var rows=AgendaEngine.expand(source("[]","[{\"id\":\"t\",\"title\":\"Task\",\"start\":\"2026-10-08\",\"end\":\"2026-10-10\"}]"),now,zone);
        var options=options("tasks:t","\"allDayTime\":\"09:00\"");var plan=AgendaEngine.reminders(rows,options,now,zone);assertEquals(3,plan.size());assertEquals(Instant.parse("2026-10-08T02:00:00Z").toEpochMilli(),plan.get(0).at());assertEquals(0,AgendaEngine.reminders(List.of(),options,now,zone).size());
    }
    @Test public void explicitDateTimeIsOneShotAcrossRepeatedOccurrences()throws Exception{
        var rows=List.of(new AgendaEngine.Entry("events:e","Event",now.plusSeconds(3600).toEpochMilli(),now.plusSeconds(7200).toEpochMilli(),false,false,"Lịch"),new AgendaEngine.Entry("events:e","Event",now.plusSeconds(86400).toEpochMilli(),now.plusSeconds(90000).toEpochMilli(),false,false,"Lịch"));
        var plan=AgendaEngine.reminders(rows,options("events:e","\"customAt\":\"2026-10-08T08:30\""),now,zone);assertEquals(1,plan.size());assertEquals(0,AgendaEngine.reminders(rows,options("events:e","\"customAt\":\"2026-10-08T07:00\""),now,zone).size());
    }
    @Test public void alarmBudgetKeepsEarliestAndRejectsExpired()throws Exception{
        List<AgendaEngine.Entry> rows=new ArrayList<>();JSONObject settings=new JSONObject(),rules=new JSONObject();settings.put("reminders",rules);
        for(int i=0;i<400;i++){String key="tasks:"+i;long time=now.plusSeconds(60L*(400-i)).toEpochMilli();rows.add(new AgendaEngine.Entry(key,key,time,time+60000,false,false,"Việc"));rules.put(key,new JSONObject().put("enabled",true).put("minutesBefore",0));}
        var plan=AgendaEngine.reminders(rows,settings,now,zone);assertEquals(256,plan.size());assertEquals(now.plusSeconds(60).toEpochMilli(),plan.get(0).at());assertEquals(256,plan.stream().map(AgendaEngine.Reminder::id).distinct().count());
    }
    @Test public void ongoingTaskCanRemindTwoHoursBeforeItsDeadlineWithPhoneRingtone()throws Exception{
        var row=new AgendaEngine.Entry("tasks:t","Running task",now.minusSeconds(3600).toEpochMilli(),now.plusSeconds(4*3600).toEpochMilli(),false,false,"Việc");
        var plan=AgendaEngine.reminders(List.of(row),options("tasks:t","\"anchor\":\"end\",\"minutesBefore\":120,\"soundMode\":\"ringtone\""),now,zone);
        assertEquals(1,plan.size());assertEquals(now.plusSeconds(2*3600).toEpochMilli(),plan.get(0).at());assertEquals("ringtone",plan.get(0).soundMode());assertTrue(plan.get(0).body().contains("Kết thúc"));
    }
    @Test public void globalAndPerRecordStopsLeaveNoPendingAlarms()throws Exception{
        var rows=List.of(new AgendaEngine.Entry("events:e","Event",now.plusSeconds(7200).toEpochMilli(),now.plusSeconds(10800).toEpochMilli(),false,false,"Lịch"));
        JSONObject settings=options("events:e","\"minutesBefore\":60");assertEquals(1,AgendaEngine.reminders(rows,settings,now,zone).size());settings.put("remindersEnabled",false);assertEquals(0,AgendaEngine.reminders(rows,settings,now,zone).size());settings.put("remindersEnabled",true);settings.getJSONObject("reminders").getJSONObject("events:e").put("enabled",false);assertEquals(0,AgendaEngine.reminders(rows,settings,now,zone).size());
    }
    @Test public void allDayDeadlineLeadMayCrossMidnightButLegacyClockStaysUnchanged()throws Exception{
        var rows=AgendaEngine.expand(source("[]","[{\"id\":\"t\",\"title\":\"Task\",\"start\":\"2026-10-08\",\"end\":\"2026-10-09\"}]"),now,zone);
        var settings=options("tasks:t","\"anchor\":\"end\",\"allDayTime\":\"01:00\",\"allDayLead\":true,\"minutesBefore\":120");var plan=AgendaEngine.reminders(rows,settings,now,zone);assertEquals(1,plan.size());assertEquals(Instant.parse("2026-10-08T16:00:00Z").toEpochMilli(),plan.get(0).at());
        settings.getJSONObject("reminders").getJSONObject("tasks:t").remove("allDayLead");assertEquals(Instant.parse("2026-10-08T18:00:00Z").toEpochMilli(),AgendaEngine.reminders(rows,settings,now,zone).get(0).at());
    }
    @Test public void sevenDayLeadIncludesAnOccurrenceBeyondTheSchedulingWindow()throws Exception{
        String date=now.plus(Duration.ofDays(32)).atZone(zone).toLocalDate().toString();var data=source("[{\"id\":\"e\",\"title\":\"Event\",\"start\":\""+date+"T09:00:00+07:00\",\"end\":\""+date+"T10:00:00+07:00\"}]","[]");
        var plan=AgendaEngine.reminders(data,options("events:e","\"minutesBefore\":10080"),now,zone);assertEquals(1,plan.size());assertTrue(plan.get(0).at()<now.plus(Duration.ofDays(30)).toEpochMilli());
    }
    @Test public void aFarFutureTaskCanHaveASoonerCustomOneShotButCompletedWorkCannot()throws Exception{
        var data=source("[]","[{\"id\":\"t\",\"title\":\"Future\",\"start\":\"2027-01-01\",\"end\":\"2027-01-02\"}]");var settings=options("tasks:t","\"customAt\":\"2026-10-08T09:00\",\"soundMode\":\"silent\"");
        var plan=AgendaEngine.reminders(data,settings,now,zone);assertEquals(1,plan.size());assertEquals("silent",plan.get(0).soundMode());data.getJSONArray("tasks").getJSONObject(0).put("progress",100);assertEquals(0,AgendaEngine.reminders(data,settings,now,zone).size());
    }
}
