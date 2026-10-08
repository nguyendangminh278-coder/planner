import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeReminderRule,leadInMinutes,validateReminderSettings} from '../src/lib/reminderSettings.js';
test('hour and minute input share one exact offset without losing the chosen duration',()=>{
 assert.equal(leadInMinutes('2','hours'),120);assert.equal(leadInMinutes('0.25','hours'),15);assert.equal(leadInMinutes('45','minutes'),45);assert.equal(leadInMinutes('','hours'),null);
 assert.doesNotThrow(()=>validateReminderSettings({reminders:{a:{enabled:true,minutesBefore:120,anchor:'end'}}}));
 for(const minutesBefore of [null,NaN,-1,10081,1.5])assert.throws(()=>validateReminderSettings({reminders:{a:{enabled:true,minutesBefore}}}));
});
test('legacy all-day reminders retain the same wall clock and notification sound',()=>{
 const old={enabled:true,minutesBefore:15,allDayTime:'09:00'};
 assert.equal(normalizeReminderRule(old,true).minutesBefore,0);assert.equal(normalizeReminderRule(old,true).allDayTime,'09:00');assert.equal(normalizeReminderRule(old,false).minutesBefore,15);assert.equal(normalizeReminderRule(old,true).soundMode,'notification');assert.equal(normalizeReminderRule(null).soundMode,'ringtone');
});
test('an expired one-shot reminder does not block unrelated edits, but cannot be re-enabled or newly scheduled in the past',()=>{
 const now=new Date('2026-10-08T12:00').getTime(),old={enabled:true,minutesBefore:15,customAt:'2026-10-08T10:00'};
 assert.doesNotThrow(()=>validateReminderSettings({reminders:{a:{...old,soundMode:'silent'}}},{reminders:{a:old}},now));
 assert.throws(()=>validateReminderSettings({reminders:{a:old}},{},now));assert.throws(()=>validateReminderSettings({reminders:{a:old}},{reminders:{a:{...old,enabled:false}}},now));assert.throws(()=>validateReminderSettings({reminders:{a:{...old,customAt:'bad'}}},{},now));
});
test('global stop can always cancel pending reminders even while an unfinished form contains an invalid offset',()=>{
 assert.doesNotThrow(()=>validateReminderSettings({remindersEnabled:false,reminders:{a:{enabled:true,minutesBefore:null}}}));
});
