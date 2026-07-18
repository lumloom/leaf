// 식물의 선호 환경과 공간의 환경을 비교해 1~5점으로 추천 점수를 낸다.

import { LIGHT_OPTIONS } from './labels.js';

const lightIndex = (v) => LIGHT_OPTIONS.findIndex((o) => o.value === v);

// 광량 차이(0~3)와 통풍 궁합으로 점수 계산
export function matchScore(plantPrefs, space) {
  if (!plantPrefs?.light || !space?.light) return null;

  const diff = Math.abs(lightIndex(plantPrefs.light) - lightIndex(space.light));
  let score = 5 - diff * 1.5; // 광량이 가장 중요

  if (plantPrefs.airflow && space.airflow) {
    if (plantPrefs.airflow === 'good' && space.airflow === 'poor') score -= 1.5;
    else if (plantPrefs.airflow === 'good' && space.airflow === 'normal') score -= 0.5;
  }

  return Math.max(1, Math.min(5, Math.round(score)));
}

// 등록된 모든 공간에 대해 점수를 매기고 높은 순으로 반환
export function rankSpaces(plantPrefs, spaces) {
  return spaces
    .map((space) => ({ space, score: matchScore(plantPrefs, space) }))
    .filter((r) => r.score !== null)
    .sort((a, b) => b.score - a.score);
}
