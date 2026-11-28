import assert from 'node:assert/strict';
import { test } from 'node:test';

test('pending plant and child deletes survive a pull; newer edits are conflicts', async (t) => {
  const user = { id: 'test-user' };
  const types = ['plants', 'events', 'soilRecipes'];
  const rows = types.map((entity_type) => ({
    entity_type, entity_id: entity_type, status: 'active', version: 1,
    payload: { id: entity_type, plantId: 'plants' },
  }));
  const edited = { entity_type: 'plants', entity_id: 'edited', status: 'active', version: 1, payload: { id: 'edited' } };
  rows.push(edited);
  const store = new Map();
  const window = new EventTarget();
  window.setTimeout = () => 0;
  window.clearTimeout = () => {};
  Object.defineProperties(globalThis, {
    window: { value: window, configurable: true },
    localStorage: { value: { getItem: (key) => store.get(key), setItem: (key, value) => store.set(key, value) }, configurable: true },
    navigator: { value: { onLine: true }, configurable: true },
  });
  t.mock.module('../src/data/supabase.js', { exports: {
    supabase: {
      auth: { getSession: async () => ({ data: { session: { user } } }), onAuthStateChange() {} },
      from() {
        const filters = new Map();
        let values;
        const query = {
          eq(key, value) { filters.set(key, value); return query; },
          update(next) { values = next; return query; },
          select() {
            if (!values) return query;
            const row = rows.find((item) => ['entity_type', 'entity_id', 'version'].every((key) => item[key] === filters.get(key)));
            if (row) Object.assign(row, values);
            return Promise.resolve({ data: row ? [structuredClone(row)] : [] });
          },
          then(resolve) { resolve({ data: structuredClone(rows) }); },
        };
        return query;
      },
    },
  } });
  const { startSync, runSync, getSyncSnapshot, resolveConflict } = await import('../src/data/sync.js');
  const { getState, plants } = await import('../src/data/db.js');
  startSync();
  await new Promise(setImmediate);
  assert.equal(getState().plants.length, 2);
  plants.remove('plants');
  plants.remove('edited');
  edited.version = 2;
  await runSync();
  assert.equal(getState().plants.length, 0);
  assert.equal(getState().events.length, 0);
  assert.equal(getState().soilRecipes.length, 0);
  assert.ok(rows.slice(0, 3).every(({ status, version }) => status === 'deleted' && version === 2));
  assert.equal(edited.status, 'active');
  assert.deepEqual(getSyncSnapshot().conflicts.map(({ key }) => key), ['plants:edited']);
  await resolveConflict('plants:edited', 'local');
  await runSync();
  assert.equal(edited.status, 'deleted');
  assert.equal(getState().plants.length, 0);
});
