import { applyRemoteEntity, getState } from './db.js';
import { getPhotoBlob, putPhotoBlob } from './photoStore.js';
import { supabase } from './supabase.js';

const APP = 'leaf';
const BUCKET = 'lumloom-assets';
const META_KEY = 'lumloom-leaf-sync-v1';
const ENTITY_TYPES = ['spaces', 'plants', 'events', 'soilRecipes'];
const listeners = new Set();

let user = null;
let busy = false;
let cloudCount = 0;
let message = '';
let isError = false;
let started = false;
let syncTimer = 0;
let syncQueued = null;

function loadMeta() {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_KEY) || '');
    if (parsed?.records && parsed?.conflicts) return parsed;
  } catch { /* 새 동기화 인덱스를 사용한다. */ }
  return { userId: null, records: {}, conflicts: {} };
}

let meta = loadMeta();
let snapshot = {
  signedIn: false, email: '', busy: false, localCount: 0, cloudCount: 0,
  pendingCount: 0, conflicts: [], message: '', error: false,
};

const keyOf = (entityType, entityId) => `${entityType}:${entityId}`;
const saveMeta = () => localStorage.setItem(META_KEY, JSON.stringify(meta));
const samePayload = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function listLocalRecords() {
  const state = getState();
  return ENTITY_TYPES.flatMap((entityType) => state[entityType].map((payload) => ({
    entityType,
    entityId: payload.id,
    payload,
    clientUpdatedAt: payload.updatedAt || payload.createdAt || null,
  })));
}

function localRecord(entityType, entityId) {
  if (!ENTITY_TYPES.includes(entityType)) return null;
  const payload = getState()[entityType].find(({ id }) => id === entityId);
  return payload ? { entityType, entityId, payload, clientUpdatedAt: payload.updatedAt || payload.createdAt || null } : null;
}

function photoIds(record) {
  if (!record?.payload) return [];
  if (record.entityType === 'plants') return record.payload.photoId ? [record.payload.photoId] : [];
  if (record.entityType === 'events') return record.payload.photoIds || [];
  return [];
}

function assetPath(assetId) {
  return `${user.id}/${APP}/${assetId}`;
}

async function uploadAssets(record) {
  for (const photoId of photoIds(record)) {
    const blob = await getPhotoBlob(photoId);
    if (!blob) continue;
    const { error } = await supabase.storage.from(BUCKET).upload(assetPath(photoId), blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
    });
    if (error) throw error;
  }
}

async function hydrateAssets(record) {
  for (const photoId of photoIds({ entityType: record.entity_type, payload: record.payload })) {
    if (await getPhotoBlob(photoId)) continue;
    const { data, error } = await supabase.storage.from(BUCKET).download(assetPath(photoId));
    if (error) throw error;
    await putPhotoBlob(photoId, data);
  }
}

async function applyRemote(record, canApply = () => true) {
  if (record.status === 'active') await hydrateAssets(record);
  if (!canApply()) return false;
  applyRemoteEntity(record.entity_type, record.entity_id, record.payload, record.status);
  return true;
}

function trackRemote(record) {
  const key = keyOf(record.entity_type, record.entity_id);
  meta.records[key] = { remoteVersion: record.version, dirty: false, deleted: record.status === 'deleted' };
  delete meta.conflicts[key];
}

async function emit() {
  const localRecords = listLocalRecords();
  snapshot = {
    signedIn: Boolean(user),
    email: user?.email || '',
    busy,
    localCount: localRecords.length,
    cloudCount,
    pendingCount: localRecords.filter((record) => {
      const tracked = meta.records[keyOf(record.entityType, record.entityId)];
      return !tracked?.remoteVersion || tracked.dirty;
    }).length,
    conflicts: Object.entries(meta.conflicts).map(([key, value]) => ({
      key,
      label: `${value.remote.entity_type} · ${value.remote.entity_id}`,
    })),
    message,
    error: isError,
  };
  listeners.forEach((listener) => listener());
}

function setMessage(next, error = false) {
  message = next;
  isError = error;
  void emit();
}

function syncErrorText(error) {
  const detail = error?.message || error?.details || error?.error_description;
  const code = error?.code ? ` (${error.code})` : '';
  return detail ? `${detail}${code}` : '잠시 후 다시 시도해주세요.';
}

async function fetchRemote() {
  const { data, error } = await supabase.from('lumloom_records').select('*').eq('app', APP);
  if (error) throw error;
  cloudCount = data.filter((record) => record.status !== 'deleted').length;
  return data;
}

async function pushRecord(local, entityType, entityId, tracked) {
  if (local) await uploadAssets(local);
  const values = {
    user_id: user.id,
    app: APP,
    entity_type: entityType,
    entity_id: entityId,
    payload: local?.payload || {},
    status: local ? 'active' : 'deleted',
    client_updated_at: local?.clientUpdatedAt,
    version: (tracked.remoteVersion || 0) + 1,
  };

  if (tracked.remoteVersion === null) {
    const { data, error } = await supabase.from('lumloom_records').insert(values).select().single();
    if (error) {
      if (error.code === '23505') return false;
      throw error;
    }
    acknowledgePush(data, tracked);
    return true;
  }

  const { data, error } = await supabase.from('lumloom_records').update(values)
    .eq('app', APP).eq('entity_type', entityType).eq('entity_id', entityId)
    .eq('version', tracked.remoteVersion).select();
  if (error) throw error;
  if (!data.length) return false;
  acknowledgePush(data[0], tracked);
  return true;
}

function acknowledgePush(record, sent) {
  const key = keyOf(record.entity_type, record.entity_id);
  const current = meta.records[key];
  if (current === sent) trackRemote(record);
  else if (current?.dirty) meta.records[key] = { ...current, remoteVersion: record.version };
  saveMeta();
}

export async function runSync(includeUntracked = false) {
  if (!user) return;
  if (busy) {
    syncQueued = Boolean(syncQueued || includeUntracked);
    return;
  }
  if (!navigator.onLine) {
    setMessage('오프라인입니다. 연결되면 다시 동기화합니다.');
    return;
  }
  busy = true;
  setMessage('기록을 확인하고 있어요…');
  try {
    const remoteRecords = await fetchRemote();
    const localRecords = listLocalRecords();
    const remoteByKey = Object.fromEntries(remoteRecords.map((record) => [keyOf(record.entity_type, record.entity_id), record]));

    for (const remote of remoteRecords) {
      const key = keyOf(remote.entity_type, remote.entity_id);
      const local = localRecord(remote.entity_type, remote.entity_id);
      const tracked = meta.records[key];
      const canApply = () => meta.records[key] === tracked;
      if (tracked?.dirty && tracked.deleted) {
        if (remote.status === 'deleted') trackRemote(remote);
        else if (tracked.remoteVersion !== remote.version) meta.conflicts[key] = { remote };
      } else if (!local && remote.status === 'active') {
        if (await applyRemote(remote, canApply)) trackRemote(remote);
      } else if (!local && remote.status === 'deleted') {
        trackRemote(remote);
      } else if (!tracked) {
        if (remote.status === 'active' && samePayload(local.payload, remote.payload)) trackRemote(remote);
        else if (includeUntracked) meta.conflicts[key] = { remote };
      } else if (tracked.dirty) {
        if (tracked.remoteVersion !== remote.version && !(remote.status === 'active' && samePayload(local?.payload, remote.payload))) {
          meta.conflicts[key] = { remote };
        }
      } else if (tracked.remoteVersion !== remote.version) {
        if (await applyRemote(remote, canApply)) trackRemote(remote);
      }
    }

    if (includeUntracked) {
      for (const local of localRecords) {
        const key = keyOf(local.entityType, local.entityId);
        if (!localRecord(local.entityType, local.entityId)) continue;
        if (meta.records[key] || meta.conflicts[key]) continue;
        if (remoteByKey[key]) meta.conflicts[key] = { remote: remoteByKey[key] };
        else meta.records[key] = { remoteVersion: null, dirty: true };
      }
    }

    for (const key of Object.keys(meta.records)) {
      const tracked = meta.records[key];
      if (!tracked?.dirty || meta.conflicts[key]) continue;
      const separator = key.indexOf(':');
      const entityType = key.slice(0, separator);
      const entityId = key.slice(separator + 1);
      const local = tracked.deleted ? null : localRecord(entityType, entityId);
      if (!local && !tracked.deleted) continue;
      const pushed = await pushRecord(local, entityType, entityId, tracked);
      if (!pushed) {
        const latest = (await fetchRemote()).find((record) => keyOf(record.entity_type, record.entity_id) === key);
        if (latest && meta.records[key] === tracked) meta.conflicts[key] = { remote: latest };
      }
    }

    saveMeta();
    const count = Object.keys(meta.conflicts).length;
    setMessage(count
      ? `${count}개의 기록은 사용할 내용을 확인해야 해요.`
      : `동기화 완료 · ${new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(new Date())}`);
  } catch (error) {
    console.error('Leaf sync failed', error);
    setMessage(`동기화하지 못했어요. ${syncErrorText(error)}`, true);
  } finally {
    busy = false;
    await emit();
    if (syncQueued !== null) {
      const includeQueuedUntracked = syncQueued;
      syncQueued = null;
      void runSync(includeQueuedUntracked);
    }
  }
}

export async function requestLogin(email, password) {
  busy = true;
  await emit();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  busy = false;
  if (error) {
    const text = error.message.toLowerCase();
    setMessage(text.includes('email not confirmed')
      ? '이메일 인증을 먼저 완료해주세요.'
      : text.includes('invalid login')
        ? '이메일 또는 비밀번호를 확인해주세요.'
        : `로그인하지 못했어요. ${syncErrorText(error)}`, true);
    return false;
  }
  setMessage('로그인했어요. 기록을 확인하고 있습니다…');
  return true;
}

export async function updatePassword(password) {
  busy = true;
  await emit();
  const { error } = await supabase.auth.updateUser({ password });
  busy = false;
  if (error) {
    setMessage(`비밀번호를 저장하지 못했어요. ${syncErrorText(error)}`, true);
    return false;
  }
  setMessage('Lumloom 공용 비밀번호를 저장했어요.');
  return true;
}

export async function signOut() {
  await supabase.auth.signOut({ scope: 'local' });
}

export async function resolveConflict(key, resolution) {
  const conflict = meta.conflicts[key];
  if (!conflict) return;
  if (resolution === 'remote') {
    await applyRemote(conflict.remote);
    trackRemote(conflict.remote);
    saveMeta();
    setMessage('클라우드 기록을 이 기기에 적용했어요.');
    return;
  }
  const { entity_type: entityType, entity_id: entityId } = conflict.remote;
  meta.records[key] = { remoteVersion: conflict.remote.version, dirty: true, deleted: !localRecord(entityType, entityId) };
  delete meta.conflicts[key];
  saveMeta();
  await runSync(false);
}

async function setUser(next) {
  user = next;
  if (user && meta.userId !== user.id) {
    meta = { userId: user.id, records: {}, conflicts: {} };
    saveMeta();
  }
  await emit();
  if (user) await runSync(false);
}

export function startSync() {
  if (started) {
    void emit();
    return;
  }
  started = true;
  window.addEventListener('lumloom:entity-changed', (event) => {
    const { entityType, entityId, action } = event.detail;
    if (!user && !meta.userId) return;
    const key = keyOf(entityType, entityId);
    meta.records[key] = { ...(meta.records[key] || { remoteVersion: null }), dirty: true, deleted: action === 'delete' };
    saveMeta();
    void emit();
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => { void runSync(false); }, 900);
  });
  window.addEventListener('online', () => { void runSync(false); });
  supabase.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => { void setUser(session?.user || null); }, 0);
  });
  void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
}

export const subscribeSync = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getSyncSnapshot = () => snapshot;
