// 로컬 저장소 레포지토리.
// 컬렉션 단위(spaces / plants / events)로 읽고 쓰는 구조라
// 추후 Firebase/Supabase로 옮길 때 이 파일만 교체하면 된다.

const STORAGE_KEY = 'lumloom-leaf/v1';

const emptyState = () => ({
  spaces: [],
  plants: [],
  events: [],
  soilRecipes: [],
  meta: { seeded: false },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifySync(entityType, entityId, action) {
  window.dispatchEvent(new CustomEvent('lumloom:entity-changed', { detail: { entityType, entityId, action } }));
}

function emit(change = null) {
  persist();
  listeners.forEach((fn) => fn());
  if (change) notifySync(change.entityType, change.entityId, change.action);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function touch(record) {
  return { ...record, updatedAt: new Date().toISOString() };
}

function upsert(collection, record, notify = true, updateTimestamp = true) {
  const now = new Date().toISOString();
  const items = state[collection];
  const idx = items.findIndex((r) => r.id === record.id);
  let saved;
  if (idx >= 0) {
    saved = updateTimestamp ? touch({ ...items[idx], ...record }) : { ...items[idx], ...record };
    state = { ...state, [collection]: items.map((r, i) => (i === idx ? saved : r)) };
  } else {
    saved = { createdAt: now, updatedAt: now, ...record, id: record.id ?? newId() };
    state = { ...state, [collection]: [...items, saved] };
  }
  emit(notify ? { entityType: collection, entityId: saved.id, action: 'upsert' } : null);
  return saved;
}

function remove(collection, id, notify = true) {
  state = { ...state, [collection]: state[collection].filter((r) => r.id !== id) };
  emit(notify ? { entityType: collection, entityId: id, action: 'delete' } : null);
}

export const spaces = {
  all: () => state.spaces,
  get: (id) => state.spaces.find((s) => s.id === id),
  save: (space, notify = true) => upsert('spaces', space, notify),
  remove: (id, notify = true) => remove('spaces', id, notify),
};

export const plants = {
  all: () => state.plants,
  get: (id) => state.plants.find((p) => p.id === id),
  save: (plant, notify = true) => upsert('plants', plant, notify),
  remove: (id, notify = true) => {
    const removedEvents = state.events.filter((event) => event.plantId === id).map((event) => event.id);
    const removedRecipes = state.soilRecipes.filter((recipe) => recipe.plantId === id).map((recipe) => recipe.id);
    state = {
      ...state,
      plants: state.plants.filter((p) => p.id !== id),
      events: state.events.filter((e) => e.plantId !== id),
      soilRecipes: state.soilRecipes.filter((r) => r.plantId !== id),
    };
    emit(notify ? { entityType: 'plants', entityId: id, action: 'delete' } : null);
    if (notify) {
      removedEvents.forEach((entityId) => notifySync('events', entityId, 'delete'));
      removedRecipes.forEach((entityId) => notifySync('soilRecipes', entityId, 'delete'));
    }
  },
};

export const soilRecipes = {
  all: () => state.soilRecipes,
  get: (id) => state.soilRecipes.find((r) => r.id === id),
  // 최신 레시피가 그 식물의 '현재 흙'
  forPlant: (plantId) =>
    state.soilRecipes
      .filter((r) => r.plantId === plantId)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt.localeCompare(a.createdAt)),
  save: (recipe, notify = true) => upsert('soilRecipes', recipe, notify),
  remove: (id, notify = true) => remove('soilRecipes', id, notify),
};

export const events = {
  all: () => state.events,
  forPlant: (plantId) =>
    state.events
      .filter((e) => e.plantId === plantId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  save: (event, notify = true) => upsert('events', event, notify),
  remove: (id, notify = true) => remove('events', id, notify),
};

export function markSeeded() {
  state = { ...state, meta: { ...state.meta, seeded: true } };
  emit();
}

export function isSeeded() {
  return !!state.meta.seeded;
}

export function resetAll() {
  const removed = ['spaces', 'plants', 'events', 'soilRecipes'].flatMap((entityType) => state[entityType].map(({ id }) => ({ entityType, id })));
  state = { ...emptyState(), meta: { seeded: true } };
  emit();
  removed.forEach(({ entityType, id }) => notifySync(entityType, id, 'delete'));
}

// 백업 복원: 전체 상태를 통째로 교체 (없는 컬렉션은 빈 배열로 채움)
export function replaceState(next) {
  const previous = state;
  state = { ...emptyState(), ...next, meta: { ...(next.meta ?? {}), seeded: true } };
  emit();
  ['spaces', 'plants', 'events', 'soilRecipes'].forEach((entityType) => {
    const nextIds = new Set(state[entityType].map(({ id }) => id));
    previous[entityType].filter(({ id }) => !nextIds.has(id)).forEach(({ id }) => notifySync(entityType, id, 'delete'));
    state[entityType].forEach(({ id }) => notifySync(entityType, id, 'upsert'));
  });
}

export function applyRemoteEntity(entityType, entityId, payload, status) {
  if (!['spaces', 'plants', 'events', 'soilRecipes'].includes(entityType)) return false;
  if (status === 'deleted') remove(entityType, entityId, false);
  else upsert(entityType, { ...payload, id: entityId }, false, false);
  return true;
}
