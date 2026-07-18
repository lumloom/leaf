# 🌿 Lumloom Leaf

> A place where plants grow, and memories grow with them.

식물 관리 앱이 아니라, **식물과 함께한 시간을 기록하는 성장 다이어리**입니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
```

## 현재 구현 (MVP)

- **홈** — 식물 카드(사진·위치·물주기 D-day·이달 새잎 배지) + 오늘 해야 할 일
- **우리집 공간 등록** — 방향·광량·직사광선 시간·통풍·메모
- **식물 등록** — 사진·이름·품종·구매 정보·화분·메모 + 선호 환경 입력
- **위치 추천** ⭐ — 식물의 선호 환경과 등록된 공간을 매칭해 별점 추천 (`src/data/match.js`)
- **성장 타임라인** — 일기·물주기·분갈이·비료·새잎·병충해 기록이 사진과 함께 시간순으로
- **퀵 기록** — 상세 화면에서 물주기/비료/새잎 원탭 기록
- **예시 데이터** — 첫 실행 시 샘플로 파키라 + 거실 창가 최소 구성 (설정에서 전체 삭제)
- **나만의 흙 레시피** — 배합 비율(막대 표시) + 평점 + 메모, 저장할 때마다 히스토리로 쌓임
- **성장 사진 비교** — 타임라인 사진 두 장을 골라 Before/After 오버레이 슬라이더
- **식물 여권** — 프로필 카드 (이름·생일·온 날·위치·화분·흙 레시피·최근 관리·성장 점수)
- **통계** — 식물 수·최장 키운 기간·이번 달 새잎·올해 분갈이·평균 물주기(실제 기록 기반) + 흙 레시피 비교
- **백업 / 복원** — 설정에서 식물별 .md(frontmatter + 위키링크, 옵시디언 호환) + 사진 + data.json + photo-manifest.json을 ZIP으로 다운로드하고, 그 ZIP으로 전체 복원 가능 (`src/data/exportMd.js`)
- **성장기록** — 모든 식물의 기록을 날짜별(최근 우선)로 통합해 "식물명 / 기록종류"로 보여주는 정원 전체 타임라인 (`src/pages/GrowthTimeline.jsx`)
- **추억보기** — 식물을 삭제하지 않고 보관(archived) — 죽거나 분양 보낸 식물도 기록을 그대로 간직
- **iOS PWA 대응** — 홈 화면에 추가한 앱에서는 `window.confirm/alert`가 표시되지 않아 앱 자체 다이얼로그(`src/components/dialog.js`)로 대체

## 다음 단계 (기획서 기준)

1. AI 사진 분석 (과습/햇빛 부족/병충해 추정) — 이벤트 스트림 구조라 기록 참조 답변에 바로 활용 가능
2. 서비스 워커 오프라인 캐시, GitHub Pages 배포, Android APK 패키징

## 구조

```
src/
  data/        # 저장소 레이어 — Supabase/Firebase 이전 시 이 폴더만 교체
    db.js        # LocalStorage 레포지토리 (spaces/plants/events 컬렉션, 구독)
    photoStore.js# 사진은 IndexedDB에 Blob 저장 (긴 변 1280px 리사이즈)
    match.js     # 위치 추천 점수 계산
    seed.js      # 예시 데이터
  hooks/       # useStore (useSyncExternalStore)
  components/  # PlantCard, PhotoInput, PhotoImg, Stars, BottomNav
  pages/       # Home, PlantForm, PlantDetail, LogForm, Spaces, SpaceForm, GrowthTimeline, Memories, Settings
  styles/      # theme.css — Lumloom 브랜드 토큰 (lumloom-website와 동일 팔레트)
```

### 설계 메모

- **데이터 모델**: 모든 기록은 `events` 단일 스트림 (`type`: diary/water/repot/fertilizer/newleaf/pest). 타임라인·D-day·통계·향후 AI 컨텍스트가 전부 여기서 파생됩니다.
- **라우팅**: HashRouter — GitHub Pages 정적 호스팅에서 새로고침이 깨지지 않음. `vite.config.js`의 `base: './'`도 같은 이유.
- **PWA**: manifest 포함(홈 화면 추가 가능). 서비스 워커 오프라인 캐시는 다음 단계.
