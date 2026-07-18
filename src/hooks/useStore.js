import { useSyncExternalStore } from 'react';
import { subscribe, getState } from '../data/db.js';

// 저장소 상태를 React에 연결. 셀렉터 없이 전체 상태를 구독한다(데이터 규모가 작음).
export function useStore() {
  return useSyncExternalStore(subscribe, getState);
}
