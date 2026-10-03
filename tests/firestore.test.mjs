import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, collection, collectionGroup, query, where } from 'firebase/firestore';

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
test('sharing permits calendar queries but keeps tasks private and denies writes', async () => {
  await seed();
  await assertSucceeds(setDoc(shareRef(dbFor('alice')), share));
  const db = dbFor('bob');
  const result = await assertSucceeds(getDocs(query(collection(db, 'events'), where('ownerId', '==', 'alice'))));
  assert.equal(result.size, 1);
  await assertFails(getDoc(doc(db, 'tasks', 'task')));
  await assertFails(updateDoc(doc(db, 'events', 'event'), { title: 'Hijacked' }));
  await assertFails(deleteDoc(doc(db, 'events', 'event')));
  await assertFails(getDoc(doc(dbFor('bob', false), 'events', 'event')));
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
test('revoking sharing immediately blocks further calendar reads', async () => {
  await seed();
  await setDoc(shareRef(dbFor('alice')), share);
  await assertSucceeds(getDoc(doc(dbFor('bob'), 'events', 'event')));
  await assertSucceeds(deleteDoc(shareRef(dbFor('alice'))));
  await assertFails(getDoc(doc(dbFor('bob'), 'events', 'event')));
});
test('profiles stay private and only their owner can write', async () => {
  await assertSucceeds(setDoc(doc(dbFor('alice'), 'profiles', 'alice'), { displayName: 'Alice', email: 'alice@example.com', photoURL: '' }));
  await assertFails(getDoc(doc(dbFor('bob'), 'profiles', 'alice')));
  await assertFails(setDoc(doc(dbFor('bob'), 'profiles', 'alice'), { displayName: 'Bob' }));
});
