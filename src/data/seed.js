// 첫 실행 시 채워 넣는 예시 데이터 — 샘플이 될 만한 최소 구성(식물 1 + 공간 1).
// 설정에서 전체 삭제 가능.

import { spaces, plants, events, soilRecipes, isSeeded, markSeeded, newId } from './db.js';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export function seedIfNeeded() {
  if (isSeeded()) return;

  const livingRoom = spaces.save({
    name: '거실 창가',
    direction: '남향',
    light: 'direct',
    directSunHours: 3,
    airflow: 'good',
    notes: '에어컨 영향 없음',
  });

  const pakira = plants.save({
    id: newId(),
    name: '파키라',
    species: '파키라 아쿠아티카',
    spaceId: livingRoom.id,
    acquiredAt: daysAgo(420),
    source: '동네 꽃집',
    potSize: '5호',
    potMaterial: '토분',
    notes: '우리집 첫 식물. 튼튼한 아이.',
    prefs: { light: 'bright-indirect', airflow: 'good' },
    wateringIntervalDays: 7,
  });

  const seedEvents = [
    { plantId: pakira.id, type: 'repot', date: daysAgo(40), text: '5호 토분으로 분갈이.' },
    { plantId: pakira.id, type: 'newleaf', date: daysAgo(12), text: '새잎 두 장 발견! 색이 연둣빛.' },
    { plantId: pakira.id, type: 'water', date: daysAgo(5) },
  ];
  seedEvents.forEach((e) => events.save(e));

  soilRecipes.save({
    plantId: pakira.id,
    date: daysAgo(40),
    ingredients: [
      { name: '혼합배양토', pct: 60 },
      { name: '펄라이트', pct: 20 },
      { name: '마사토', pct: 20 },
    ],
    rating: 5,
    note: '새잎 잘 남. 물빠짐 좋음.',
  });

  markSeeded();
}
