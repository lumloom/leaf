import { soilRecipes } from '../data/db.js';
import { formatDate } from '../data/plantUtils.js';
import Stars from './Stars.jsx';

// 흙 레시피 한 건 표시: 배합 막대 + 평점(탭해서 수정 가능) + 메모
export default function RecipeCard({ recipe, title, onDelete }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-round)' }}>{title ?? '🪴 흙 레시피'}</span>
        <span className="muted">{formatDate(recipe.date)}</span>
      </div>

      <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
        {recipe.ingredients.map((ing, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 84, fontSize: 13, flexShrink: 0 }}>{ing.name}</span>
            <div style={{ flex: 1, height: 8, background: 'var(--color-surface-alt)', borderRadius: 999 }}>
              <div
                style={{
                  width: `${Math.min(100, ing.pct)}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  borderRadius: 999,
                }}
              />
            </div>
            <span className="muted" style={{ width: 38, textAlign: 'right' }}>
              {ing.pct}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Stars value={recipe.rating ?? 0} onChange={(v) => soilRecipes.save({ ...recipe, rating: v })} />
        {!recipe.rating && <span className="muted">별을 탭해서 평가</span>}
      </div>
      {recipe.note && <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{recipe.note}</p>}

      {onDelete && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, padding: '2px 6px' }} onClick={onDelete}>
          삭제
        </button>
      )}
    </div>
  );
}
