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

function emit() {
  persist();
  listeners.forEach((fn) => fn());
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

function upsert(collection, record) {
  const now = new Date().toISOString();
  const items = state[collection];
  const idx = items.findIndex((r) => r.id === record.id);
  let saved;
  if (idx >= 0) {
    saved = touch({ ...items[idx], ...record });
    state = { ...state, [collection]: items.map((r, i) => (i === idx ? saved : r)) };
  } else {
    saved = { createdAt: now, updatedAt: now, ...record, id: record.id ?? newId() };
    state = { ...state, [collection]: [...items, saved] };
  }
  emit();
  return saved;
}

function remove(collection, id) {
  state = { ...state, [collection]: state[collection].filter((r) => r.id !== id) };
  emit();
}

export const spaces = {
  all: () => state.spaces,
  get: (id) => state.spaces.find((s) => s.id === id),
  save: (space) => upsert('spaces', space),
  remove: (id) => remove('spaces', id),
};

export const plants = {
  all: () => state.plants,
  get: (id) => state.plants.find((p) => p.id === id),
  save: (plant) => upsert('plants', plant),
  remove: (id) => {
    state = {
      ...state,
      plants: state.plants.filter((p) => p.id !== id),
      events: state.events.filter((e) => e.plantId !== id),
      soilRecipes: state.soilRecipes.filter((r) => r.plantId !== id),
    };
    emit();
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
  save: (recipe) => upsert('soilRecipes', recipe),
  remove: (id) => remove('soilRecipes', id),
};

export const events = {
  all: () => state.events,
  forPlant: (plantId) =>
    state.events
      .filter((e) => e.plantId === plantId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  save: (event) => upsert('events', event),
  remove: (id) => remove('events', id),
};

export function markSeeded() {
  state = { ...state, meta: { ...state.meta, seeded: true } };
  emit();
}

export function isSeeded() {
  return !!state.meta.seeded;
}

export function resetAll() {
  state = { ...emptyState(), meta: { seeded: true } };
  emit();
}

// 백업 복원: 전체 상태를 통째로 교체 (없는 컬렉션은 빈 배열로 채움)
export function replaceState(next) {
  state = { ...emptyState(), ...next, meta: { ...(next.meta ?? {}), seeded: true } };
  emit();
}
