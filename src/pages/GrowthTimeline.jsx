import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { EVENT_TYPES } from '../data/labels.js';
import { formatDate } from '../data/plantUtils.js';
import PhotoImg from '../components/PhotoImg.jsx';

// 우리집 정원 전체의 통합 타임라인. 모든 식물의 기록을 날짜순(최근 우선)으로 섞어서 보여준다.
// 추억으로 보낸 식물은 제외 — 지금 자라고 있는 정원의 이야기에 집중.
export default function GrowthTimeline() {
  const { plants, events } = useStore();
  const activePlants = plants.filter((p) => !p.archived);
  const plantById = Object.fromEntries(activePlants.map((p) => [p.id, p]));

  const byDate = {};
  events
    .filter((e) => plantById[e.plantId])
    .forEach((e) => {
      (byDate[e.date] ??= []).push(e);
    });

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  dates.forEach((d) => byDate[d].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));

  return (
    <div className="page">
      <h1 className="page-title">📔 성장기록</h1>
      <p className="page-sub">우리집 정원이 함께 자라는 이야기예요.</p>

      {dates.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🌱</div>
          아직 기록이 없어요.
          <br />
          식물 상세에서 오늘의 기록을 남겨보세요.
        </div>
      ) : (
        dates.map((date) => (
          <div key={date}>
            <div className="section-title" style={{ margin: '24px 0 8px' }}>
              {formatDate(date)}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {byDate[date].map((ev) => {
                const plant = plantById[ev.plantId];
                const meta = EVENT_TYPES[ev.type] ?? EVENT_TYPES.diary;
                return (
                  <Link
                    key={ev.id}
                    to={`/plants/${plant.id}`}
                    className="card"
                    style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 12 }}
                  >
                    <PhotoImg
                      photoId={plant.photoId}
                      alt={plant.name}
                      style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-round)' }}>{plant.name}</span>
                        <span className="muted">
                          {' '}
                          / {meta.icon} {meta.label}
                        </span>
                      </div>
                      {ev.text && (
                        <div
                          className="muted"
                          style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {ev.text}
                        </div>
                      )}
                    </div>
                    {ev.photoIds?.length > 0 && (
                      <PhotoImg
                        photoId={ev.photoIds[0]}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
