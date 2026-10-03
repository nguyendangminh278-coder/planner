import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, collection, collectionGroup, query, where, serverTimestamp } from 'firebase/firestore';

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-planner', firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });
const dbFor = (uid, verified = true) => env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: verified }).firestore();
const event = { ownerId: 'alice', title: 'Private calendar', start: '2026-10-05T02:00:00.000Z', end: '2026-10-05T03:00:00.000Z', color: '#d7e8ff' };
const task = { ownerId: 'alice', title: 'Private task', start: '2026-10-05', end: '2026-10-10', progress: 0, details: 'Private notes', color: '#e8d8f4', steps: [] };
async function seed() {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'events', 'event'), event);
    await setDoc(doc(context.firestore(), 'tasks', 'task'), task);
  });
}
const shareRef = db => doc(db, 'calendarShares', 'alice', 'viewers', 'bob@example.com');
const share = { ownerId: 'alice', ownerName: 'Alice', viewerEmail: 'bob@example.com', permission: 'read' };

test('owners can create/read/update/delete their events and tasks', async () => {
  const db = dbFor('alice');
  for (const [kind, value] of [['events', event], ['tasks', task]]) {
    const ref = doc(db, kind, 'own');
    await assertSucceeds(setDoc(ref, value));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { title: 'Updated' }));
    await assertSucceeds(deleteDoc(ref));
  }
});
test('anonymous users and other accounts cannot access private data', async () => {
  await seed();
  for (const db of [env.unauthenticatedContext().firestore(), dbFor('bob')]) {
    await assertFails(getDoc(doc(db, 'events', 'event')));
    await assertFails(getDoc(doc(db, 'tasks', 'task')));
    await assertFails(setDoc(doc(db, 'events', 'spoof'), event));
  }
});
test('ownerId cannot be changed; malformed records cannot be saved', async () => {
  await seed();
  const db = dbFor('alice');
  await assertFails(updateDoc(doc(db, 'events', 'event'), { ownerId: 'bob' }));
  await assertFails(updateDoc(doc(db, 'tasks', 'task'), { ownerId: 'bob' }));
  await assertFails(setDoc(doc(db, 'events', 'invalid'), { ...event, end: event.start }));
  await assertFails(setDoc(doc(db, 'tasks', 'invalid'), { ...task, progress: 101 }));
  await assertFails(setDoc(doc(db, 'tasks', 'too-many'), { ...task, steps: Array(31).fill({}) }));
});
test('sharing permits the entire calendar and task tree but denies all viewer writes', async () => {
  await seed();
  await assertSucceeds(setDoc(shareRef(dbFor('alice')), share));
  const db = dbFor('bob');
  const result = await assertSucceeds(getDocs(query(collection(db, 'events'), where('ownerId', '==', 'alice'))));
  assert.equal(result.size, 1);
  const sharedTask = await assertSucceeds(getDoc(doc(db, 'tasks', 'task')));
  assert.equal(sharedTask.data().details, 'Private notes');
  const taskResult = await assertSucceeds(getDocs(query(collection(db, 'tasks'), where('ownerId', '==', 'alice'))));
  assert.equal(taskResult.size, 1);
  await assertFails(updateDoc(doc(db, 'tasks', 'task'), { details: 'Changed by viewer' }));
  await assertFails(deleteDoc(doc(db, 'tasks', 'task')));
  await assertFails(setDoc(doc(db, 'tasks', 'spoofed'), task));
  await assertFails(updateDoc(doc(db, 'events', 'event'), { title: 'Hijacked' }));
  await assertFails(deleteDoc(doc(db, 'events', 'event')));
  await assertFails(getDoc(doc(dbFor('bob', false), 'events', 'event')));
  await assertFails(getDoc(doc(dbFor('bob', false), 'tasks', 'task')));
});
test('only owners manage sharing; viewers only discover their own grants', async () => {
  await assertSucceeds(setDoc(shareRef(dbFor('alice')), share));
  const db = dbFor('bob');
  const result = await assertSucceeds(getDocs(query(collectionGroup(db, 'viewers'), where('viewerEmail', '==', 'bob@example.com'))));
  assert.equal(result.size, 1);
  await assertFails(getDocs(collectionGroup(db, 'viewers')));
  await assertFails(setDoc(shareRef(db), share));
  await assertFails(deleteDoc(shareRef(db)));
  await assertSucceeds(getDocs(collection(dbFor('alice'), 'calendarShares', 'alice', 'viewers')));
});
test('revoking sharing immediately blocks calendar and task reads', async () => {
  await seed();
  await setDoc(shareRef(dbFor('alice')), share);
  await assertSucceeds(getDoc(doc(dbFor('bob'), 'events', 'event')));
  await assertSucceeds(getDoc(doc(dbFor('bob'), 'tasks', 'task')));
  await assertSucceeds(deleteDoc(shareRef(dbFor('alice'))));
  await assertFails(getDoc(doc(dbFor('bob'), 'events', 'event')));
  await assertFails(getDoc(doc(dbFor('bob'), 'tasks', 'task')));
  await assertFails(getDocs(query(collection(dbFor('bob'), 'tasks'), where('ownerId', '==', 'alice'))));
});

test('a grant to one owner does not expose other owners or their nested task notes', async () => {
  await seed();
  const step = { id: 'step', title: 'Private step', start: '2026-10-05', end: '2026-10-06', details: 'Step-level notes', progress: 50, color: '#d7e8ff' };
  await env.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'tasks', 'task'), { steps: [step] });
    await setDoc(doc(context.firestore(), 'tasks', 'other-owner'), { ...task, ownerId: 'charlie' });
  });
  await setDoc(shareRef(dbFor('alice')), share);
  const shared = await assertSucceeds(getDoc(doc(dbFor('bob'), 'tasks', 'task')));
  assert.equal(shared.data().steps[0].details, 'Step-level notes');
  await assertFails(getDoc(doc(dbFor('bob'), 'tasks', 'other-owner')));
  await assertFails(getDocs(query(collection(dbFor('bob'), 'tasks'), where('ownerId', '==', 'charlie'))));
});
test('profiles stay private and only their owner can write', async () => {
  await assertSucceeds(setDoc(doc(dbFor('alice'), 'profiles', 'alice'), { displayName: 'Alice', email: 'alice@example.com', photoURL: '' }));
  await assertFails(getDoc(doc(dbFor('bob'), 'profiles', 'alice')));
  await assertFails(setDoc(doc(dbFor('bob'), 'profiles', 'alice'), { displayName: 'Bob' }));
});

test('mood entries can be saved and queried by their owner, including notes', async () => {
  const db = dbFor('alice'), ref = doc(db, 'moodEntries', 'alice_2026-10-03');
  await assertSucceeds(setDoc(ref, { ownerId: 'alice', date: '2026-10-03', moodId: 'sunny', note: 'A good day', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(ref, { moodId: 'rainbow', note: 'Feeling creative', updatedAt: serverTimestamp() }));
  const saved = await assertSucceeds(getDoc(ref)); assert.equal(saved.data().note, 'Feeling creative');
  const result = await assertSucceeds(getDocs(query(collection(db, 'moodEntries'), where('ownerId', '==', 'alice'))));
  assert.equal(result.size, 1);
});
test('moods remain private even when a calendar is shared; spoofing and malformed entries are denied', async () => {
  const db = dbFor('alice'), path = ['moodEntries', 'alice_2026-10-03'];
  const entry = { ownerId: 'alice', date: '2026-10-03', moodId: 'cloudy', note: 'Private note', updatedAt: serverTimestamp() };
  await setDoc(doc(db, ...path), entry);
  await setDoc(shareRef(db), share);
  for (const other of [dbFor('bob'), env.unauthenticatedContext().firestore()]) {
    await assertFails(getDoc(doc(other, ...path)));
    await assertFails(setDoc(doc(other, ...path), entry));
    await assertFails(getDocs(query(collection(other, 'moodEntries'), where('ownerId', '==', 'alice'))));
  }
  await assertFails(updateDoc(doc(db, ...path), { ownerId: 'bob', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(db, 'moodEntries', 'wrong-id'), entry));
  await assertFails(setDoc(doc(db, ...path), { ...entry, moodId: 'invalid' }));
  await assertFails(setDoc(doc(db, ...path), { ...entry, note: 'x'.repeat(4001) }));
});

test('recurring and all-day series can be stored once and read by granted viewers without editing rights', async () => {
  const db = dbFor('alice');
  const recurrence = { frequency:'weekly', interval:2, weekdays:[1,3], monthlyMode:'date', endType:'count', untilDate:null, count:13 };
  await assertSucceeds(setDoc(doc(db,'events','series'), { ...event, allDay:false, timeZone:'Asia/Bangkok', recurrence }));
  await assertSucceeds(setDoc(doc(db,'events','all-day'), { ...event, allDay:true, timeZone:'Asia/Bangkok', recurrence:null }));
  await setDoc(shareRef(db),share);
  const shared = await assertSucceeds(getDoc(doc(dbFor('bob'),'events','series')));
  assert.equal(shared.data().recurrence.count,13);
  await assertFails(updateDoc(doc(dbFor('bob'),'events','series'),{recurrence:null}));
});
test('invalid recurrence maps and missing timezone fields are rejected, including malformed intervals and endpoints', async () => {
  const db = dbFor('alice'), ref = doc(db,'events','invalid-series');
  const recurrence = { frequency:'weekly', interval:1, weekdays:[6], monthlyMode:'date', endType:'never', untilDate:null, count:null };
  await assertFails(setDoc(ref,{...event,recurrence}));
  for (const bad of [ {...recurrence,interval:0}, {...recurrence,weekdays:[]}, {...recurrence,weekdays:[8]}, {...recurrence,frequency:'unknown'}, {...recurrence,endType:'count',count:0}, {...recurrence,endType:'until',untilDate:'bad'}, {...recurrence,extra:'not allowed'} ]) {
    await assertFails(setDoc(ref,{...event,timeZone:'Asia/Bangkok',recurrence:bad}));
  }
  await assertFails(setDoc(ref,{...event,allDay:'yes',recurrence:null}));
});
