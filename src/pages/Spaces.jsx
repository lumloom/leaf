import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { lightLabel, airflowLabel } from '../data/labels.js';

export default function Spaces() {
  const { spaces, plants } = useStore();

  return (
    <div className="page">
      <h1 className="page-title">🏠 우리집 공간</h1>
      <p className="page-sub">공간의 빛과 바람을 기록해두면, 식물의 자리를 추천해드려요.</p>

      {spaces.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🪟</div>
          아직 등록된 공간이 없어요.
          <br />
          거실 창가, 베란다부터 등록해 볼까요?
        </div>
      ) : (
        spaces.map((s) => {
          const residents = plants.filter((p) => p.spaceId === s.id);
          return (
            <Link key={s.id} to={`/spaces/${s.id}/edit`} className="card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-round)', fontSize: 16 }}>{s.name}</span>
                {s.direction && s.direction !== '해당 없음' && <span className="badge">{s.direction}</span>}
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {[
                  lightLabel(s.light),
                  s.directSunHours ? `직사광선 ${s.directSunHours}시간` : null,
                  airflowLabel(s.airflow),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              {s.notes && <div className="muted" style={{ marginTop: 2 }}>{s.notes}</div>}
              {residents.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {residents.map((p) => (
                    <span key={p.id} className="badge">
                      🌿 {p.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })
      )}

      <Link to="/spaces/new" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
        + 공간 등록하기
      </Link>
    </div>
  );
}
