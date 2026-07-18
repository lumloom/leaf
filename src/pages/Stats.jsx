import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { daysWith } from '../data/plantUtils.js';
import RecipeCard from '../components/RecipeCard.jsx';
import { soilRecipes as recipesRepo } from '../data/db.js';

export default function Stats() {
  const { plants, events, soilRecipes } = useStore();

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearPrefix = `${now.getFullYear()}-`;

  // 가장 오래 키운 식물
  const oldest = plants
    .map((p) => ({ plant: p, days: daysWith(p.acquiredAt) }))
    .filter((x) => x.days)
    .sort((a, b) => b.days - a.days)[0];

  const leafThisMonth = events.filter((e) => e.type === 'newleaf' && e.date.startsWith(monthPrefix)).length;
  const repotThisYear = events.filter((e) => e.type === 'repot' && e.date.startsWith(yearPrefix)).length;

  // 평균 물주기: 식물별 연속된 물주기 기록 사이 간격을 전부 모아 평균
  const intervals = [];
  plants.forEach((p) => {
    const waterDates = events
      .filter((e) => e.plantId === p.id && e.type === 'water')
      .map((e) => e.date)
      .sort();
    for (let i = 1; i < waterDates.length; i++) {
      const gap = (new Date(waterDates[i]) - new Date(waterDates[i - 1])) / 86400000;
      if (gap > 0) intervals.push(gap);
    }
  });
  const avgWatering = intervals.length
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : null;

  const formatYears = (days) => (days >= 365 ? `${Math.floor(days / 365)}년 ${Math.floor((days % 365) / 30)}개월` : `${days}일`);

  // 흙 레시피 비교: 평점 높은 순
  const ratedRecipes = [...soilRecipes].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const tiles = [
    { label: '우리집 식물', value: `${plants.length}개` },
    oldest && { label: `가장 오래 키운 식물 · ${oldest.plant.name}`, value: formatYears(oldest.days) },
    { label: '이번 달 새잎', value: `${leafThisMonth}개` },
    { label: '올해 분갈이', value: `${repotThisYear}회` },
    avgWatering && { label: '평균 물주기', value: `${avgWatering}일` },
    { label: '쌓인 기록', value: `${events.length}개` },
  ].filter(Boolean);

  return (
    <div className="page">
      <h1 className="page-title">📊 우리집 정원의 시간</h1>
      <p className="page-sub">기록이 쌓일수록 이 화면이 더 풍성해져요.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tiles.map((t) => (
          <div key={t.label} className="card" style={{ padding: 14, margin: 0 }}>
            <div className="muted" style={{ fontSize: 12, fontFamily: 'var(--font-round)' }}>
              {t.label}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--color-accent-deep)', marginTop: 4 }}>
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="section-title">흙 레시피 비교</h2>
      {ratedRecipes.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🪴</div>
          아직 저장된 흙 레시피가 없어요.
          <br />
          식물 카드에서 지금 쓰는 배합을 남겨보세요.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {ratedRecipes.map((r) => {
            const plant = plants.find((p) => p.id === r.plantId);
            return (
              <div key={r.id}>
                <RecipeCard
                  recipe={r}
                  title={
                    plant ? (
                      <Link to={`/plants/${plant.id}`} style={{ color: 'var(--color-accent-deep)' }}>
                        🌿 {plant.name}
                      </Link>
                    ) : (
                      '🪴 흙 레시피'
                    )
                  }
                  onDelete={() => {
                    if (confirm('이 레시피를 삭제할까요?')) recipesRepo.remove(r.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
