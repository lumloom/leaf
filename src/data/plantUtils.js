// 이벤트 기록에서 파생되는 값들 (마지막 물주기, D-day, 새잎 수 등)

export function lastEventOfType(events, plantId, type) {
  return events
    .filter((e) => e.plantId === plantId && e.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

// 물주기 D-day: 음수면 지남, 0이면 오늘, 양수면 남은 일수. 주기 미설정이면 null.
export function wateringDday(events, plant) {
  if (!plant.wateringIntervalDays) return null;
  const last = lastEventOfType(events, plant.id, 'water');
  const base = last ? new Date(last.date) : plant.acquiredAt ? new Date(plant.acquiredAt) : null;
  if (!base) return null;
  const due = new Date(base);
  due.setDate(due.getDate() + plant.wateringIntervalDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

export function newLeafCountThisMonth(events, plantId) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return events.filter((e) => e.plantId === plantId && e.type === 'newleaf' && e.date.startsWith(prefix)).length;
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${y}.${m}.${d}`;
}

export function daysWith(acquiredAt) {
  if (!acquiredAt) return null;
  const days = Math.floor((Date.now() - new Date(acquiredAt).getTime()) / 86400000);
  return days >= 0 ? days + 1 : null;
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
