import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClassItem, validDate, safeLink, readClassRows, loadClassFeed } from '../src/lib/classFeed.js';

const row = { id: '1', title: 'Class assignment', due_date: '2026-10-05', type: 'general', item_kind: 'task', group_id: null, color: '#abcdef', link: 'https://example.com/assignment' };
const options = { url: 'https://example.supabase.co', key: 'sb_publishable_test' };
test('class records preserve date-only deadlines and distinguish events/tasks', () => {
  const item = normalizeClassItem(row);
  assert.equal(item.date, '2026-10-05'); assert.equal(item.kind, 'task'); assert.equal(item.source, 'class');
  assert.equal(normalizeClassItem({ ...row, item_kind: 'event' }).kind, 'event');
  assert.equal(validDate('2026-02-30'), null); assert.equal(validDate('bad'), null);
});
test('private records and internal metadata never become class items', () => {
  assert.equal(normalizeClassItem({ ...row, type: 'private' }), null);
  assert.equal(normalizeClassItem({ ...row, title: '__SYS_PWD_HASH__' }), null);
  assert.equal(normalizeClassItem({ ...row, title: '__DAY_IMAGE__' }), null);
  assert.equal(normalizeClassItem({ ...row, item_kind: 'unknown' }), null);
});
test('unsafe links and colors are rejected', () => {
  assert.equal(safeLink('javascript:alert(1)'), ''); assert.equal(safeLink('data:text/html,bad'), '');
  const item = normalizeClassItem({ ...row, link: 'javascript:alert(1)', color: 'url(javascript:alert(1))' });
  assert.equal(item.link, ''); assert.equal(item.color, '#a6bdb1');
});
test('pagination respects response caps and only uses GET with a publishable header', async () => {
  const calls = [];
  const rows = await readClassRows({ ...options, table: 'deadlines', params: { select: 'id', order: 'id.asc' }, pageSize: 250, fetcher: async (url, init) => {
    calls.push({ url, init });
    const offset = Number(url.searchParams.get('offset'));
    return new Response(JSON.stringify(offset === 0 ? [{ id: '1' }, { id: '2' }] : [{ id: '3' }]), { headers: { 'content-range': offset === 0 ? '0-1/3' : '2-2/3' } });
  } });
  assert.equal(rows.length, 3); assert.equal(calls.length, 2);
  assert.equal(calls[1].url.searchParams.get('offset'), '2');
  assert.ok(calls.every(({init}) => init.method === 'GET' && init.headers.apikey === options.key && !init.headers.Authorization));
});
test('class loading constrains queries to general records and removes system titles', async () => {
  const calls = [];
  const feed = await loadClassFeed({ ...options, fetcher: async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(url.pathname.endsWith('/groups') ? [{ id: 'g', name: 'Class group' }] : [row, { ...row, id: '2', title: '__DAY_IMAGE__' }, { ...row, id: '3', type: 'private' }]));
  } });
  assert.equal(feed.items.length, 1);
  const query = calls.find(call => call.url.pathname.endsWith('/deadlines')).url.searchParams;
  assert.equal(query.get('type'), 'eq.general'); assert.equal(query.get('title'), 'not.match.^__');
});
test('optional group-name failures do not hide available tasks', async () => {
  const feed = await loadClassFeed({ ...options, fetcher: async url => url.pathname.endsWith('/groups') ? new Response('{}', { status: 403 }) : new Response(JSON.stringify([row])) });
  assert.equal(feed.items.length, 1); assert.equal(feed.groups.length, 0); assert.ok(feed.warning);
});
test('network, access and malformed responses are errors rather than empty calendars', async () => {
  const run = fetcher => readClassRows({ ...options, table: 'deadlines', params: {}, fetcher });
  await assert.rejects(run(async () => new Response('{}', { status: 403 })), /SELECT\/RLS/);
  await assert.rejects(run(async () => new Response('{}')), /không hợp lệ/);
  await assert.rejects(run(async () => { throw new Error('Network failed'); }), /Network failed/);
});
