// api/sync.js
// CMO Nest Airtable backup. Self-bootstraps tables in the ECOFIT base
// on first call. Subsequent calls reuse cached table IDs.
//
// Modes:
//   sync_all  -> push full state to Airtable (upsert calls + items, soft delete missing)
//   restore   -> pull full state back from Airtable (returns calls + items + lastWeeklySendDate)
//   log_send  -> append a weekly update record AND return new send date
//   ping      -> health check, ensures schema exists, returns table IDs

const BASE_ID = process.env.AIRTABLE_ECOFIT_BASE_ID || 'appkCLcOtOfpYJkRg';
const AIRTABLE_API = 'https://api.airtable.com/v0';
const TIMEZONE = 'America/Chicago';

const TABLE_NAMES = {
  calls: 'CMO Nest Calls',
  items: 'CMO Nest Items',
  weekly: 'CMO Nest Weekly Updates',
  settings: 'CMO Nest Settings'
};

// Warm-start cache. Vercel keeps modules in memory between invocations.
let tableIdCache = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'AIRTABLE_TOKEN not configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};
  const mode = body.mode || 'ping';

  try {
    const tableIds = await ensureSchema(token);

    if (mode === 'ping') {
      return res.status(200).json({ ok: true, baseId: BASE_ID, tableIds });
    }
    if (mode === 'sync_all') {
      const result = await syncAll(token, tableIds, body.state || {});
      return res.status(200).json(result);
    }
    if (mode === 'restore') {
      const result = await restore(token, tableIds);
      return res.status(200).json(result);
    }
    if (mode === 'log_send') {
      const result = await logSend(token, tableIds, body.send || {});
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: 'Unknown mode: ' + mode });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

/* ============================================================
   Schema bootstrap
   ============================================================ */

async function ensureSchema(token) {
  if (tableIdCache) return tableIdCache;

  // List existing tables in the base
  const listRes = await fetch(`${AIRTABLE_API}/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!listRes.ok) {
    const t = await listRes.text();
    throw new Error(`Could not list tables: ${listRes.status} ${t.slice(0, 200)}`);
  }
  const listData = await listRes.json();
  const existing = {};
  (listData.tables || []).forEach(t => { existing[t.name] = t.id; });

  const ids = {};
  for (const key of Object.keys(TABLE_NAMES)) {
    const name = TABLE_NAMES[key];
    if (existing[name]) {
      ids[key] = existing[name];
    } else {
      ids[key] = await createTable(token, key);
    }
  }
  tableIdCache = ids;
  return ids;
}

function tableSchema(key) {
  if (key === 'calls') {
    return {
      name: TABLE_NAMES.calls,
      description: 'CMO Nest: one row per processed transcript',
      fields: [
        { name: 'Call ID', type: 'singleLineText' },
        { name: 'Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Headline', type: 'singleLineText' },
        { name: 'Summary', type: 'multilineText' },
        { name: 'Label', type: 'singleLineText' },
        { name: 'Processed At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: TIMEZONE } },
        { name: 'Deleted', type: 'checkbox', options: { icon: 'xCheckbox', color: 'redBright' } }
      ]
    };
  }
  if (key === 'items') {
    return {
      name: TABLE_NAMES.items,
      description: 'CMO Nest: next steps, decisions, open questions extracted from calls',
      fields: [
        { name: 'Item ID', type: 'singleLineText' },
        { name: 'Text', type: 'multilineText' },
        { name: 'Type', type: 'singleSelect', options: { choices: [
          { name: 'Next step', color: 'greenBright' },
          { name: 'Decision', color: 'purpleBright' },
          { name: 'Open question', color: 'cyanBright' }
        ] } },
        { name: 'Owner', type: 'singleSelect', options: { choices: [
          { name: 'Bill', color: 'greenBright' },
          { name: 'Dave', color: 'cyanBright' },
          { name: 'Phil', color: 'purpleBright' },
          { name: 'Both', color: 'orangeBright' }
        ] } },
        { name: 'Status', type: 'singleSelect', options: { choices: [
          { name: 'Open', color: 'grayBright' },
          { name: 'In progress', color: 'yellowBright' },
          { name: 'Done', color: 'greenBright' }
        ] } },
        { name: 'Archived', type: 'checkbox', options: { icon: 'check', color: 'grayBright' } },
        { name: 'Call ID', type: 'singleLineText' },
        { name: 'Call Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: TIMEZONE } },
        { name: 'Status Changed At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: TIMEZONE } },
        { name: 'Deleted', type: 'checkbox', options: { icon: 'xCheckbox', color: 'redBright' } }
      ]
    };
  }
  if (key === 'weekly') {
    return {
      name: TABLE_NAMES.weekly,
      description: 'CMO Nest: weekly update emails sent to Dave',
      fields: [
        { name: 'Send ID', type: 'singleLineText' },
        { name: 'Sent At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: TIMEZONE } },
        { name: 'Subject', type: 'singleLineText' },
        { name: 'Body', type: 'multilineText' },
        { name: 'Item Count', type: 'number', options: { precision: 0 } },
        { name: 'Items Included', type: 'multilineText' }
      ]
    };
  }
  if (key === 'settings') {
    return {
      name: TABLE_NAMES.settings,
      description: 'CMO Nest: single-row settings (last weekly send date, etc.)',
      fields: [
        { name: 'Key', type: 'singleLineText' },
        { name: 'Value', type: 'multilineText' },
        { name: 'Updated At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: TIMEZONE } }
      ]
    };
  }
  throw new Error('Unknown table key: ' + key);
}

async function createTable(token, key) {
  const schema = tableSchema(key);
  const res = await fetch(`${AIRTABLE_API}/meta/bases/${BASE_ID}/tables`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(schema)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Could not create table ${schema.name}: ${res.status} ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.id;
}

/* ============================================================
   Sync operations
   ============================================================ */

function typeToLabel(t) {
  if (t === 'decision') return 'Decision';
  if (t === 'open_question') return 'Open question';
  return 'Next step';
}
function statusToLabel(s) {
  if (s === 'in_progress') return 'In progress';
  if (s === 'done') return 'Done';
  return 'Open';
}

async function airtableRequest(token, method, path, body) {
  const res = await fetch(`${AIRTABLE_API}/${BASE_ID}/${path}`, {
    method: method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Airtable ${method} ${path}: ${res.status} ${t.slice(0, 300)}`);
  }
  return res.json();
}

async function fetchAllRecords(token, tableId) {
  const all = [];
  let offset = null;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);
    const data = await airtableRequest(token, 'GET', `${tableId}?${params.toString()}`);
    all.push(...(data.records || []));
    offset = data.offset || null;
  } while (offset);
  return all;
}

async function syncAll(token, tableIds, state) {
  const calls = Array.isArray(state.calls) ? state.calls : [];
  const items = Array.isArray(state.items) ? state.items : [];
  const lastWeeklySendDate = state.lastWeeklySendDate || null;

  // Upsert calls in batches of 10
  const callRecords = calls.map(c => ({
    fields: {
      'Call ID': c.id,
      'Date': c.date || null,
      'Headline': c.headline || '',
      'Summary': c.summary || '',
      'Label': c.label || '',
      'Processed At': c.processed_at || null,
      'Deleted': false
    }
  }));
  await upsertBatched(token, tableIds.calls, callRecords, ['Call ID']);

  // Upsert items in batches of 10
  const itemRecords = items.map(i => ({
    fields: {
      'Item ID': i.id,
      'Text': i.text || '',
      'Type': typeToLabel(i.type),
      'Owner': i.owner || 'Bill',
      'Status': statusToLabel(i.status),
      'Archived': !!i.archived,
      'Call ID': i.call_id || '',
      'Call Date': i.call_date || null,
      'Created At': i.created_at || null,
      'Status Changed At': i.status_changed_at || null,
      'Deleted': false
    }
  }));
  await upsertBatched(token, tableIds.items, itemRecords, ['Item ID']);

  // Soft-delete records that exist in Airtable but not in state
  const localCallIds = new Set(calls.map(c => c.id));
  const localItemIds = new Set(items.map(i => i.id));

  const remoteCalls = await fetchAllRecords(token, tableIds.calls);
  const callsToSoftDelete = remoteCalls
    .filter(r => {
      const cid = r.fields && r.fields['Call ID'];
      const isDeleted = r.fields && r.fields['Deleted'];
      return cid && !localCallIds.has(cid) && !isDeleted;
    })
    .map(r => ({ id: r.id, fields: { 'Deleted': true } }));
  if (callsToSoftDelete.length > 0) {
    await updateBatched(token, tableIds.calls, callsToSoftDelete);
  }

  const remoteItems = await fetchAllRecords(token, tableIds.items);
  const itemsToSoftDelete = remoteItems
    .filter(r => {
      const iid = r.fields && r.fields['Item ID'];
      const isDeleted = r.fields && r.fields['Deleted'];
      return iid && !localItemIds.has(iid) && !isDeleted;
    })
    .map(r => ({ id: r.id, fields: { 'Deleted': true } }));
  if (itemsToSoftDelete.length > 0) {
    await updateBatched(token, tableIds.items, itemsToSoftDelete);
  }

  // Settings: write lastWeeklySendDate
  await upsertBatched(token, tableIds.settings, [{
    fields: {
      'Key': 'lastWeeklySendDate',
      'Value': lastWeeklySendDate || '',
      'Updated At': new Date().toISOString()
    }
  }], ['Key']);

  return {
    ok: true,
    synced: { calls: callRecords.length, items: itemRecords.length },
    softDeleted: { calls: callsToSoftDelete.length, items: itemsToSoftDelete.length },
    timestamp: new Date().toISOString()
  };
}

async function upsertBatched(token, tableId, records, mergeOn) {
  if (records.length === 0) return;
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    await airtableRequest(token, 'PATCH', tableId, {
      performUpsert: { fieldsToMergeOn: mergeOn },
      records: batch
    });
  }
}

async function updateBatched(token, tableId, records) {
  if (records.length === 0) return;
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    await airtableRequest(token, 'PATCH', tableId, { records: batch });
  }
}

async function restore(token, tableIds) {
  const [callsRows, itemsRows, settingsRows] = await Promise.all([
    fetchAllRecords(token, tableIds.calls),
    fetchAllRecords(token, tableIds.items),
    fetchAllRecords(token, tableIds.settings)
  ]);

  const calls = callsRows
    .filter(r => r.fields && !r.fields['Deleted'])
    .map(r => ({
      id: r.fields['Call ID'],
      date: r.fields['Date'] || '',
      headline: r.fields['Headline'] || '',
      summary: r.fields['Summary'] || '',
      label: r.fields['Label'] || '',
      processed_at: r.fields['Processed At'] || ''
    }))
    .filter(c => c.id);

  const typeFromLabel = (l) => {
    if (l === 'Decision') return 'decision';
    if (l === 'Open question') return 'open_question';
    return 'next_step';
  };
  const statusFromLabel = (l) => {
    if (l === 'In progress') return 'in_progress';
    if (l === 'Done') return 'done';
    return 'open';
  };

  const items = itemsRows
    .filter(r => r.fields && !r.fields['Deleted'])
    .map(r => ({
      id: r.fields['Item ID'],
      text: r.fields['Text'] || '',
      type: typeFromLabel(r.fields['Type']),
      owner: r.fields['Owner'] || 'Bill',
      status: statusFromLabel(r.fields['Status']),
      archived: !!r.fields['Archived'],
      call_id: r.fields['Call ID'] || '',
      call_date: r.fields['Call Date'] || '',
      created_at: r.fields['Created At'] || '',
      status_changed_at: r.fields['Status Changed At'] || ''
    }))
    .filter(i => i.id);

  let lastWeeklySendDate = null;
  const sendRow = settingsRows.find(r => r.fields && r.fields['Key'] === 'lastWeeklySendDate');
  if (sendRow && sendRow.fields['Value']) lastWeeklySendDate = sendRow.fields['Value'];

  // Sort calls newest first
  calls.sort((a, b) => (b.processed_at || '').localeCompare(a.processed_at || ''));

  return { ok: true, state: { calls, items, lastWeeklySendDate } };
}

async function logSend(token, tableIds, send) {
  const now = new Date().toISOString();
  const sendId = send.id || ('send_' + Date.now().toString(36));
  await airtableRequest(token, 'POST', tableIds.weekly, {
    records: [{
      fields: {
        'Send ID': sendId,
        'Sent At': now,
        'Subject': send.subject || 'Weekly update',
        'Body': send.body || '',
        'Item Count': typeof send.itemCount === 'number' ? send.itemCount : 0,
        'Items Included': Array.isArray(send.itemIds) ? send.itemIds.join('\n') : ''
      }
    }]
  });
  // Update settings
  await upsertBatched(token, tableIds.settings, [{
    fields: { 'Key': 'lastWeeklySendDate', 'Value': now, 'Updated At': now }
  }], ['Key']);
  return { ok: true, sendId: sendId, sentAt: now };
}
