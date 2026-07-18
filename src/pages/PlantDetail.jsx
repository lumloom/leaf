import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { plants, events as eventsRepo, soilRecipes } from '../data/db.js';
import RecipeCard from '../components/RecipeCard.jsx';
import { appConfirm } from '../components/dialog.js';
import { EVENT_TYPES, lightLabel, airflowLabel, humidityLabel } from '../data/labels.js';
import { formatDate, daysWith, wateringDday, todayIso } from '../data/plantUtils.js';
import PhotoImg from '../components/PhotoImg.jsx';

// 퀵 기록 버튼으로 바로 남기는 관리 기록
const QUICK_ACTIONS = ['water', 'fertilizer', 'newleaf'];

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants: allPlants, spaces, events, soilRecipes: allRecipes } = useStore();
  const plant = allPlants.find((p) => p.id === id);
  const recipes = allRecipes
    .filter((r) => r.plantId === id)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  if (!plant) {
    return (
      <div className="page">
        <div className="empty">식물을 찾을 수 없어요.</div>
      </div>
    );
  }

  const space = spaces.find((s) => s.id === plant.spaceId);
  const timeline = events
    .filter((e) => e.plantId === plant.id)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const days = daysWith(plant.acquiredAt);
  const dday = wateringDday(events, plant);

  function quickLog(type) {
    eventsRepo.save({ plantId: plant.id, type, date: todayIso(), text: '', photoIds: [] });
  }

  async function handleArchive() {
    const ok = await appConfirm(
      `'${plant.name}'을(를) 추억으로 보낼까요?\n식물 탭에서는 사라지지만, '추억보기'에서 언제든 다시 볼 수 있어요.`,
      { confirmLabel: '추억으로' }
    );
    if (ok) {
      plants.save({ ...plant, archived: true, archivedAt: todayIso() });
      navigate('/', { replace: true });
    }
  }

  async function handleRestore() {
    const ok = await appConfirm(`'${plant.name}'을(를) 다시 우리집 식물로 되돌릴까요?`, { confirmLabel: '되돌리기' });
    if (ok) {
      plants.save({ ...plant, archived: false, archivedAt: null });
      navigate('/', { replace: true });
    }
  }

  async function handleDelete() {
    const ok = await appConfirm(`'${plant.name}'와(과) 모든 기록을 삭제할까요?\n되돌릴 수 없어요.`, {
      confirmLabel: '삭제',
      danger: true,
    });
    if (ok) {
      plants.remove(plant.id);
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
        ‹ 뒤로
      </button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '12px 0 4px' }}>
        <PhotoImg photoId={plant.photoId} alt={plant.name} style={{ width: 88, height: 88, borderRadius: 24 }} />
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {plant.name}
          </h1>
          {plant.species && <div className="muted">{plant.species}</div>}
          {days && <div className="muted">함께한 지 {days}일째</div>}
          {plant.archived && <span className="badge">🕊️ 추억 속 식물</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
        {QUICK_ACTIONS.map((type) => (
          <button key={type} className="btn btn-sm" style={{ flex: 1 }} onClick={() => quickLog(type)}>
            {EVENT_TYPES[type].icon} {EVENT_TYPES[type].label}
          </button>
        ))}
      </div>
      {!plant.archived && dday !== null && (
        <div className="muted" style={{ marginBottom: 8 }}>
          💧 {dday < 0 ? `물주기가 ${-dday}일 지났어요` : dday === 0 ? '오늘은 물 주는 날이에요' : `다음 물주기까지 ${dday}일`}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'grid', gap: 6 }}>
          <InfoRow label="위치" value={space?.name ?? '미지정'} />
          {plant.potSize || plant.potMaterial ? (
            <InfoRow label="화분" value={[plant.potSize, plant.potMaterial].filter(Boolean).join(' · ')} />
          ) : null}
          {plant.acquiredAt && <InfoRow label="우리집 온 날" value={formatDate(plant.acquiredAt)} />}
          {plant.source && <InfoRow label="구매처" value={plant.source} />}
          {plant.price && <InfoRow label="구매가격" value={`${Number(plant.price).toLocaleString()}원`} />}
          {(plant.prefs?.light || plant.prefs?.airflow || plant.prefs?.humidity) && (
            <InfoRow
              label="좋아하는 환경"
              value={[
                lightLabel(plant.prefs.light),
                airflowLabel(plant.prefs.airflow),
                humidityLabel(plant.prefs.humidity),
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          )}
          {plant.notes && <InfoRow label="메모" value={plant.notes} />}
          {plant.caution && <InfoRow label="⚠️ 주의사항" value={plant.caution} />}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => navigate(`/plants/${plant.id}/edit`)}>
          정보 수정
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Link to={`/plants/${plant.id}/passport`} className="btn btn-sm" style={{ flex: 1 }}>
          🌿 식물 여권
        </Link>
        <Link to={`/plants/${plant.id}/compare`} className="btn btn-sm" style={{ flex: 1 }}>
          📷 성장 비교
        </Link>
      </div>

      <h2 className="section-title">나만의 흙 레시피</h2>
      {recipes.length === 0 ? (
        <div className="muted" style={{ marginBottom: 10 }}>
          아직 저장된 흙 레시피가 없어요. 지금 쓰는 배합을 남겨보세요.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
          {recipes.map((r, idx) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              title={idx === 0 ? '🪴 현재 흙' : '이전 레시피'}
              onDelete={async () => {
                if (await appConfirm('이 레시피를 삭제할까요?', { confirmLabel: '삭제', danger: true }))
                  soilRecipes.remove(r.id);
              }}
            />
          ))}
        </div>
      )}
      <Link to={`/plants/${plant.id}/soil`} className="btn btn-block">
        + 새 흙 레시피 남기기
      </Link>

      <h2 className="section-title">성장 타임라인</h2>
      <Link to={`/plants/${plant.id}/log`} className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>
        ✏️ 오늘의 기록 남기기
      </Link>

      {timeline.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🍃</div>
          아직 기록이 없어요. 첫 기록을 남겨보세요.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {timeline.map((ev) => (
            <TimelineItem key={ev.id} event={ev} />
          ))}
        </div>
      )}

      <button className="btn btn-danger btn-block" style={{ margin: '28px 0 0' }} onClick={handleDelete}>
        이 식물 보내주기 (삭제)
      </button>
      {plant.archived ? (
        <button className="btn btn-block" style={{ margin: '8px 0' }} onClick={handleRestore}>
          🌿 다시 우리집 식물로 (되돌리기)
        </button>
      ) : (
        <button className="btn btn-block" style={{ margin: '8px 0' }} onClick={handleArchive}>
          🕊️ 추억으로 보내주기 (이동)
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span className="muted" style={{ width: 90, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span>
    </div>
  );
}

function TimelineItem({ event }) {
  const meta = EVENT_TYPES[event.type] ?? EVENT_TYPES.diary;
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-round)' }}>
          {meta.icon} {meta.label}
        </span>
        <span className="muted">{formatDate(event.date)}</span>
      </div>
      {event.text && <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{event.text}</p>}
      {event.photoIds?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
          {event.photoIds.map((pid) => (
            <PhotoImg key={pid} photoId={pid} alt="" style={{ width: 96, height: 96, borderRadius: 12, flexShrink: 0 }} />
          ))}
        </div>
      )}
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginTop: 6, padding: '2px 6px' }}
        onClick={async () => {
          if (await appConfirm('이 기록을 삭제할까요?', { confirmLabel: '삭제', danger: true }))
            eventsRepo.remove(event.id);
        }}
      >
        삭제
      </button>
    </div>
  );
}
