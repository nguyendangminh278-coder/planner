export function validDate(value) {
  if (typeof value !== 'string') return null;
  const key = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const date = new Date(`${key}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key ? key : null;
}

export function safeLink(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}

export function normalizeClassItem(row) {
  const date = validDate(row.due_date);
  // This database also contains internal metadata and private records, which are not class items.
  if (row.type !== 'general' || typeof row.title !== 'string' || !row.title.trim() || row.title.startsWith('__') || !date) return null;
  if (!['event', 'task'].includes(row.item_kind)) return null;
  return {
    id: `class:${row.id}`, title: row.title.trim(), date,
    kind: row.item_kind, groupId: row.group_id || '', assignee: row.assignee || '',
    link: safeLink(row.link), color: /^#[0-9a-f]{6}$/i.test(row.color || '') ? row.color : '#a6bdb1',
    source: 'class',
  };
}

export async function readClassRows({ url, key, table, params, signal, fetcher = fetch, pageSize = 250 }) {
  const rows = [];
  // A stable unique ordering plus offset/limit respects the server's response cap.
  for (let page = 0; page < 200; page++) {
    const endpoint = new URL(`/rest/v1/${table}`, url);
    for (const [name, value] of Object.entries(params)) endpoint.searchParams.set(name, value);
    endpoint.searchParams.set('offset', String(rows.length));
    endpoint.searchParams.set('limit', String(pageSize));
    const response = await fetcher(endpoint, { method: 'GET', headers: { apikey: key, Accept: 'application/json', Prefer: 'count=exact' }, signal, cache: 'no-store' });
    if (!response.ok) throw new Error([401, 403].includes(response.status) ? 'Supabase chưa cho phép đọc dữ liệu chung của lớp bằng khóa publishable. Hãy kiểm tra quyền SELECT/RLS của nguồn lớp.' : `Không tải được nguồn lớp (HTTP ${response.status}). Hãy thử làm mới.`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Nguồn lớp trả về dữ liệu không hợp lệ.');
    rows.push(...batch);
    const contentRange = response.headers.get('content-range') || '';
    const match = contentRange.match(/\/(\d+)$/);
    if (match && rows.length >= Number(match[1])) return rows;
    if (!batch.length || (!match && batch.length < pageSize)) return rows;
  }
  throw new Error('Nguồn lớp có quá nhiều dữ liệu để tải trong một lần.');
}

export async function loadClassFeed(options) {
  const [items, groups] = await Promise.allSettled([
    readClassRows({ ...options, table: 'deadlines', params: { select: 'id,title,due_date,link,type,group_id,assignee,color,item_kind', type: 'eq.general', title: 'not.match.^__', item_kind: 'in.(event,task)', order: 'due_date.asc,id.asc' } }),
    readClassRows({ ...options, table: 'groups', params: { select: 'id,name', order: 'id.asc' } }),
  ]);
  if (items.status === 'rejected') throw items.reason;
  return {
    items: items.value.map(normalizeClassItem).filter(Boolean),
    groups: groups.status === 'fulfilled' ? groups.value : [],
    warning: groups.status === 'rejected' ? 'Đã tải lịch và công việc, nhưng chưa tải được tên nhóm.' : '',
  };
}
