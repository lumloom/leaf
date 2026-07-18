// 옵시디언 백업: 식물마다 .md 파일 하나 + 사진(jpg) + 원본 data.json을 ZIP으로 묶어 다운로드한다.

import JSZip from 'jszip';
import { getState, replaceState } from './db.js';
import { getPhotoBlob, putPhotoBlob, clearPhotos } from './photoStore.js';
import { EVENT_TYPES, lightLabel, airflowLabel, humidityLabel } from './labels.js';
import { formatDate, daysWith } from './plantUtils.js';

const starsText = (n) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '평가 없음');

// 파일명으로 못 쓰는 문자 제거
const safeName = (name) => name.replace(/[\\/:*?"<>|#^[\]]/g, '').trim() || '이름없음';

function spaceMd(spaces, plants) {
  const lines = ['---', 'type: lumloom-spaces', 'tags: [lumloom-leaf]', '---', '', '# 🏠 우리집 공간', ''];
  spaces.forEach((s) => {
    lines.push(`## ${s.name}`, '');
    if (s.direction && s.direction !== '해당 없음') lines.push(`- 방향: ${s.direction}`);
    if (s.light) lines.push(`- 광량: ${lightLabel(s.light)}`);
    if (s.directSunHours) lines.push(`- 직사광선: ${s.directSunHours}시간`);
    if (s.airflow) lines.push(`- 통풍: ${airflowLabel(s.airflow)}`);
    if (s.notes) lines.push(`- 메모: ${s.notes}`);
    const residents = plants.filter((p) => p.spaceId === s.id).map((p) => `[[${safeName(p.name)}]]`);
    if (residents.length) lines.push(`- 함께 있는 식물: ${residents.join(', ')}`);
    lines.push('');
  });
  return lines.join('\n');
}

function plantMd(plant, { space, recipes, timeline, photoFiles }) {
  const lines = [
    '---',
    'type: plant',
    `name: ${plant.name}`,
    plant.species ? `species: ${plant.species}` : null,
    space ? `location: ${space.name}` : null,
    plant.acquiredAt ? `acquired: ${plant.acquiredAt}` : null,
    plant.birthday ? `birthday: ${plant.birthday}` : null,
    'tags: [lumloom-leaf, plant]',
    '---',
    '',
    `# 🌿 ${plant.name}`,
    '',
    '## 기본 정보',
    '',
  ].filter((l) => l !== null);

  if (plant.species) lines.push(`- 품종: ${plant.species}`);
  lines.push(`- 위치: ${space ? `[[우리집 공간#${space.name}|${space.name}]]` : '미지정'}`);
  if (plant.acquiredAt) {
    const days = daysWith(plant.acquiredAt);
    lines.push(`- 우리집 온 날: ${formatDate(plant.acquiredAt)}${days ? ` (${days}일째)` : ''}`);
  }
  if (plant.birthday) lines.push(`- 생일: ${formatDate(plant.birthday)}`);
  if (plant.source) lines.push(`- 구매처: ${plant.source}`);
  if (plant.price) lines.push(`- 구매가격: ${Number(plant.price).toLocaleString()}원`);
  if (plant.potSize || plant.potMaterial)
    lines.push(`- 화분: ${[plant.potSize, plant.potMaterial].filter(Boolean).join(' · ')}`);
  if (plant.prefs?.light || plant.prefs?.airflow || plant.prefs?.humidity)
    lines.push(
      `- 좋아하는 환경: ${[
        lightLabel(plant.prefs.light),
        airflowLabel(plant.prefs.airflow),
        humidityLabel(plant.prefs.humidity),
      ]
        .filter(Boolean)
        .join(' · ')}`
    );
  if (plant.wateringIntervalDays) lines.push(`- 물주기 주기: ${plant.wateringIntervalDays}일`);
  if (plant.notes) lines.push(`- 메모: ${plant.notes}`);
  if (plant.caution) lines.push(`- 키우기 주의사항: ${plant.caution}`);
  if (plant.archived) lines.push(`- 상태: 추억 속 식물 🕊️`);
  lines.push('');

  if (photoFiles.profile) {
    lines.push(`![[${photoFiles.profile}]]`, '');
  }

  if (recipes.length > 0) {
    lines.push('## 흙 레시피', '');
    recipes.forEach((r, idx) => {
      lines.push(`### ${formatDate(r.date)}${idx === 0 ? ' (현재)' : ''} — ${starsText(r.rating)}`, '');
      r.ingredients.forEach((i) => lines.push(`- ${i.name} ${i.pct}%`));
      if (r.note) lines.push('', `> ${r.note}`);
      lines.push('');
    });
  }

  if (timeline.length > 0) {
    lines.push('## 성장 타임라인', '');
    timeline.forEach((ev) => {
      const meta = EVENT_TYPES[ev.type] ?? EVENT_TYPES.diary;
      lines.push(`### ${formatDate(ev.date)} — ${meta.icon} ${meta.label}`, '');
      if (ev.text) lines.push(ev.text, '');
      (photoFiles.byEvent[ev.id] ?? []).forEach((f) => lines.push(`![[${f}]]`, ''));
    });
  }

  lines.push('---', '', '*Lumloom Leaf 백업*');
  return lines.join('\n');
}

export async function exportBackupZip() {
  const state = getState();
  const zip = new JSZip();
  const photosDir = zip.folder('photos');
  // 복원 시 photoId → ZIP 안 파일 경로를 되찾기 위한 매니페스트
  const photoManifest = {};

  // 같은 이름의 식물이 있어도 파일명이 겹치지 않게
  const usedNames = new Set();
  const uniqueName = (base) => {
    let name = base;
    let n = 2;
    while (usedNames.has(name)) name = `${base} ${n++}`;
    usedNames.add(name);
    return name;
  };

  for (const plant of state.plants) {
    const fileBase = uniqueName(safeName(plant.name));
    const space = state.spaces.find((s) => s.id === plant.spaceId);
    const recipes = state.soilRecipes
      .filter((r) => r.plantId === plant.id)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    const timeline = state.events
      .filter((e) => e.plantId === plant.id)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

    // 사진 수집: 프로필 + 타임라인
    const photoFiles = { profile: null, byEvent: {} };
    let photoIdx = 1;
    const addPhoto = async (photoId, suffix) => {
      const blob = await getPhotoBlob(photoId);
      if (!blob) return null;
      const fname = `${fileBase}-${suffix}.jpg`;
      photosDir.file(fname, blob);
      photoManifest[photoId] = `photos/${fname}`;
      return fname;
    };

    if (plant.photoId) {
      photoFiles.profile = await addPhoto(plant.photoId, '프로필');
    }
    for (const ev of timeline) {
      for (const pid of ev.photoIds ?? []) {
        const fname = await addPhoto(pid, `${ev.date}-${photoIdx++}`);
        if (fname) (photoFiles.byEvent[ev.id] ??= []).push(fname);
      }
    }

    zip.file(`${fileBase}.md`, plantMd(plant, { space, recipes, timeline, photoFiles }));
  }

  if (state.spaces.length > 0) {
    zip.file('우리집 공간.md', spaceMd(state.spaces, state.plants));
  }

  // 앱으로 다시 불러올 수 있는 원본 데이터 + 사진 매니페스트
  zip.file('data.json', JSON.stringify(state, null, 2));
  zip.file('photo-manifest.json', JSON.stringify(photoManifest, null, 2));

  return zip.generateAsync({ type: 'blob' });
}

// 백업 ZIP에서 전체 상태 복원. 현재 데이터를 통째로 교체한다.
export async function importBackupZip(file) {
  const zip = await JSZip.loadAsync(file);

  const dataFile = zip.file('data.json');
  if (!dataFile) throw new Error('백업 파일이 아니에요 (data.json 없음)');
  const state = JSON.parse(await dataFile.async('string'));
  if (!Array.isArray(state.plants) || !Array.isArray(state.spaces) || !Array.isArray(state.events)) {
    throw new Error('데이터 형식이 올바르지 않아요');
  }

  await clearPhotos();
  const manifestFile = zip.file('photo-manifest.json');
  if (manifestFile) {
    const manifest = JSON.parse(await manifestFile.async('string'));
    for (const [photoId, path] of Object.entries(manifest)) {
      const photo = zip.file(path);
      if (photo) await putPhotoBlob(photoId, await photo.async('blob'));
    }
  }

  replaceState(state);
  return { plants: state.plants.length, spaces: state.spaces.length, events: state.events.length };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
