package com.nguyendangminh.planner;
import org.junit.Test;import static org.junit.Assert.*;
import org.json.*;import java.time.*;import java.util.*;
public class WidgetDataTest {
    final Instant now=Instant.parse("2026-10-08T03:00:00Z");final ZoneId zone=ZoneId.of("Asia/Bangkok");
    @Test public void workListContainsOnlyRootsAndRetainsOverdueAndCompletedRows()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[{\"id\":\"e\",\"title\":\"Event\",\"start\":\"2026-10-08T09:00:00+07:00\",\"end\":\"2026-10-08T10:00:00+07:00\"}],\"tasks\":[{\"id\":\"t\",\"title\":\"Task\",\"summary\":\"Short detail\",\"start\":\"2026-10-01\",\"end\":\"2026-10-07\",\"progress\":100,\"steps\":[{\"id\":\"s\",\"title\":\"Step\",\"start\":\"2026-10-08\",\"end\":\"2026-10-08\"}]},{\"id\":\"future\",\"title\":\"Future\",\"start\":\"2026-10-09\",\"end\":\"2026-10-10\"}]}");
        var rows=WidgetData.tasks(source,now,zone);assertEquals(1,rows.size());assertEquals("t",rows.get(0).id());assertEquals("Short detail",rows.get(0).summary());assertTrue(rows.get(0).completed());assertEquals(1,WidgetData.calendar(source,now,zone).timed().size());
    }
    @Test public void timeGridUsesActualMinutesAndSeparatesOverlapLanes()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[{\"id\":\"a\",\"title\":\"A\",\"start\":\"2026-10-08T09:00:00+07:00\",\"end\":\"2026-10-08T11:30:00+07:00\"},{\"id\":\"b\",\"title\":\"B\",\"start\":\"2026-10-08T10:30:00+07:00\",\"end\":\"2026-10-08T12:00:00+07:00\"},{\"id\":\"c\",\"title\":\"C\",\"start\":\"2026-10-08T13:30:00+07:00\",\"end\":\"2026-10-08T17:30:00+07:00\"}],\"tasks\":[]}");
        var grid=WidgetData.calendar(source,now,zone);assertEquals(3,grid.timed().size());assertEquals(540,grid.timed().get(0).startMinute(),.01);assertEquals(690,grid.timed().get(0).endMinute(),.01);assertNotEquals(grid.timed().get(0).lane(),grid.timed().get(1).lane());assertEquals(2,grid.timed().get(0).lanes());assertEquals(1,grid.timed().get(2).lanes());
    }
    @Test public void overnightIsClippedAndAllDayStaysOutsideTheHourGrid()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[{\"id\":\"night\",\"title\":\"Night\",\"start\":\"2026-10-07T23:00:00+07:00\",\"end\":\"2026-10-08T02:00:00+07:00\"},{\"id\":\"day\",\"title\":\"Day\",\"start\":\"2026-10-07T17:00:00Z\",\"end\":\"2026-10-08T17:00:00Z\",\"allDay\":true,\"timeZone\":\"Asia/Bangkok\"}],\"tasks\":[]}");
        var grid=WidgetData.calendar(source,now,zone);assertEquals(1,grid.allDay().size());assertEquals(1,grid.timed().size());assertEquals(0,grid.timed().get(0).startMinute(),.01);assertEquals(120,grid.timed().get(0).endMinute(),.01);assertEquals(0,grid.startHour());
    }
    @Test public void snippetCollapsesWhitespaceAndDoesNotSplitEmoji(){String value=WidgetData.summary(" A\n B "+"😀".repeat(160));assertTrue(value.startsWith("A B "));assertTrue(value.endsWith("…"));assertEquals(141,value.codePointCount(0,value.length()));assertFalse(value.contains("\n"));}
    @Test public void threeDaysAreYesterdayTodayTomorrowAndCanMoveForward()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[{\"id\":\"e\",\"title\":\"Tomorrow\",\"start\":\"2026-10-09T09:00:00+07:00\",\"end\":\"2026-10-09T10:00:00+07:00\"}],\"tasks\":[]}");
        var window=WidgetData.threeDays(source,LocalDate.parse("2026-10-08"),zone);assertEquals(3,window.days().size());assertEquals(0,window.days().get(1).timed().size());assertEquals(1,window.days().get(2).timed().size());
        var next=WidgetData.threeDays(source,LocalDate.parse("2026-10-09"),zone);assertEquals(1,next.days().get(1).timed().size());
    }
    @Test public void tickingRetainsTheRowAndItsPosition()throws Exception{
        JSONObject source=new JSONObject("{\"events\":[],\"tasks\":[{\"id\":\"a\",\"title\":\"A\",\"start\":\"2026-10-07\",\"end\":\"2026-10-09\",\"progress\":0},{\"id\":\"b\",\"title\":\"B\",\"start\":\"2026-10-08\",\"end\":\"2026-10-10\",\"progress\":0}]}");
        assertEquals("a",WidgetData.tasks(source,now,zone).get(0).id());source.getJSONArray("tasks").getJSONObject(0).put("progress",100);var rows=WidgetData.tasks(source,now,zone);assertEquals(2,rows.size());assertEquals("a",rows.get(0).id());assertTrue(rows.get(0).completed());
    }
}
