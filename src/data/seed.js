// Recognize complete, untouched examples from versions that populated a new garden.
function matches(record, fields, dates = []) {
  if (!record?.createdAt || record.createdAt !== record.updatedAt) return false;
  const keys = ['id', 'createdAt', 'updatedAt', ...dates, ...Object.keys(fields)];
  return Object.keys(record).length === keys.length &&
    keys.every((key) => Object.hasOwn(record, key)) &&
    Object.entries(fields).every(([key, value]) => JSON.stringify(record[key]) === JSON.stringify(value));
}

export function withoutLegacyExamples(state) {
  const removed = new Set();
  for (const plant of state.plants) {
    if (!matches(plant, {
      name: '파키라', species: '파키라 아쿠아티카', spaceId: plant.spaceId,
      source: '동네 꽃집', potSize: '5호', potMaterial: '토분',
      notes: '우리집 첫 식물. 튼튼한 아이.',
      prefs: { light: 'bright-indirect', airflow: 'good' }, wateringIntervalDays: 7,
    }, ['acquiredAt'])) continue;

    const space = state.spaces.find(({ id }) => id === plant.spaceId);
    const events = state.events.filter(({ plantId }) => plantId === plant.id);
    const recipes = state.soilRecipes.filter(({ plantId }) => plantId === plant.id);
    const sampleEvents = [
      { type: 'repot', text: '5호 토분으로 분갈이.' },
      { type: 'newleaf', text: '새잎 두 장 발견! 색이 연둣빛.' },
      { type: 'water' },
    ];
    if (events.length !== sampleEvents.length || !sampleEvents.every((sample) =>
      events.some((event) => matches(event, { ...sample, plantId: plant.id }, ['date'])))) continue;
    if (recipes.length !== 1 || !matches(recipes[0], {
      plantId: plant.id,
      ingredients: [
        { name: '혼합배양토', pct: 60 },
        { name: '펄라이트', pct: 20 },
        { name: '마사토', pct: 20 },
      ],
      rating: 5, note: '새잎 잘 남. 물빠짐 좋음.',
    }, ['date'])) continue;

    for (const record of [plant, ...events, ...recipes]) removed.add(record);
    if (matches(space, {
      name: '거실 창가', direction: '남향', light: 'direct',
      directSunHours: 3, airflow: 'good', notes: '에어컨 영향 없음',
    }) && !state.plants.some((other) => other !== plant && other.spaceId === space.id)) {
      removed.add(space);
    }
  }
  if (!removed.size) return state;
  return {
    ...state,
    plants: state.plants.filter((record) => !removed.has(record)),
    spaces: state.spaces.filter((record) => !removed.has(record)),
    events: state.events.filter((record) => !removed.has(record)),
    soilRecipes: state.soilRecipes.filter((record) => !removed.has(record)),
  };
}
