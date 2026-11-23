import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { lastEventOfType, formatDate, daysWith } from '../data/plantUtils.js';
import PhotoImg from '../components/PhotoImg.jsx';
import Stars from '../components/Stars.jsx';

// 식물 여권: 한 식물의 프로필을 한 장의 카드로
export default function Passport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, spaces, events, soilRecipes } = useStore();
  const plant = plants.find((p) => p.id === id);

  if (!plant) {
    return (
      <div className="page">
        <div className="empty">식물을 찾을 수 없어요.</div>
      </div>
    );
  }

  const space = spaces.find((s) => s.id === plant.spaceId);
  const myEvents = events.filter((e) => e.plantId === id);
  const recipe = soilRecipes
    .filter((r) => r.plantId === id)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];

  const lastRepot = lastEventOfType(events, id, 'repot');
  const lastWater = lastEventOfType(events, id, 'water');
  const lastLeaf = lastEventOfType(events, id, 'newleaf');
  const days = daysWith(plant.acquiredAt);

  // 성장 점수: 새잎 하나당 10점 + 기록 하나당 2점 (기록이 쌓일수록 커지는 점수)
  const leafCount = myEvents.filter((e) => e.type === 'newleaf').length;
  const growthScore = leafCount * 10 + myEvents.length * 2;

  const rows = [
    ['이름', plant.name],
    plant.species && ['품종', plant.species],
    plant.birthday && ['생일', formatDate(plant.birthday)],
    plant.acquiredAt && ['우리집 온 날', `${formatDate(plant.acquiredAt)} (${days}일째)`],
    ['위치', space?.name ?? '미지정'],
    (plant.potSize || plant.potMaterial) && ['화분', [plant.potSize, plant.potMaterial].filter(Boolean).join(' · ')],
    recipe && ['흙 레시피', recipe.ingredients.map((i) => `${i.name} ${i.pct}%`).join(' · ')],
    lastRepot && ['최근 분갈이', formatDate(lastRepot.date)],
    lastWater && ['최근 물주기', formatDate(lastWater.date)],
    lastLeaf && ['최근 새잎', formatDate(lastLeaf.date)],
  ].filter(Boolean);

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
        ‹ 뒤로
      </button>

      <div
        className="card"
        style={{ marginTop: 12, padding: 24, background: 'var(--color-surface)', textAlign: 'center' }}
      >
        <div className="brand-title" style={{ color: 'var(--color-accent-deep)', letterSpacing: 1, fontSize: 13 }}>
          🌿 PLANT PASSPORT
        </div>

        <PhotoImg
          photoId={plant.photoId}
          alt={plant.name}
          style={{ width: 120, height: 120, borderRadius: '50%', margin: '18px auto 10px' }}
        />
        <div style={{ fontFamily: 'var(--font-round)', fontSize: 22 }}>{plant.name}</div>
        {recipe?.rating ? (
          <div style={{ marginTop: 4 }}>
            <Stars value={recipe.rating} />
          </div>
        ) : null}

        <div
          style={{
            borderTop: '1px dashed var(--color-border)',
            margin: '18px 0',
          }}
        />

        <div style={{ display: 'grid', gap: 8, textAlign: 'left' }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 12 }}>
              <span className="muted" style={{ width: 92, flexShrink: 0, fontFamily: 'var(--font-round)' }}>
                {label}
              </span>
              <span style={{ flex: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}
        >
          <span className="muted" style={{ fontFamily: 'var(--font-round)' }}>
            성장 점수
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-accent-deep)' }}>
            {growthScore}
          </div>
          <div className="muted">새잎 {leafCount}번 · 기록 {myEvents.length}개가 쌓인 점수예요.</div>
        </div>

        <div className="brand-title muted" style={{ marginTop: 18, fontSize: 12 }}>
          Lumloom Leaf
        </div>
      </div>
    </div>
  );
}
