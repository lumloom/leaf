import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { plants, soilRecipes } from '../data/db.js';
import { todayIso } from '../data/plantUtils.js';
import Stars from '../components/Stars.jsx';

const COMMON_INGREDIENTS = ['혼합배양토', '펄라이트', '마사토', '바크', '코코피트', '산야초', '녹소토', '훈탄'];

// 나만의 흙 레시피 작성. 저장할 때마다 새 기록으로 남아 시간이 지나면 비교할 수 있다.
export default function SoilRecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plant = plants.get(id);

  const [date, setDate] = useState(todayIso());
  const [ingredients, setIngredients] = useState([
    { name: '혼합배양토', pct: 60 },
    { name: '펄라이트', pct: 20 },
    { name: '마사토', pct: 20 },
  ]);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  if (!plant) {
    return (
      <div className="page">
        <div className="empty">식물을 찾을 수 없어요.</div>
      </div>
    );
  }

  const total = ingredients.reduce((sum, i) => sum + (Number(i.pct) || 0), 0);

  const setIngredient = (idx, key, value) =>
    setIngredients((list) => list.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));

  const addIngredient = (name = '') => setIngredients((list) => [...list, { name, pct: '' }]);
  const removeIngredient = (idx) => setIngredients((list) => list.filter((_, i) => i !== idx));

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = ingredients
      .map((i) => ({ name: i.name.trim(), pct: Number(i.pct) || 0 }))
      .filter((i) => i.name && i.pct > 0);
    if (cleaned.length === 0) return;
    soilRecipes.save({ plantId: plant.id, date, ingredients: cleaned, rating, note: note.trim() });
    navigate(`/plants/${plant.id}`, { replace: true });
  }

  return (
    <div className="page">
      <h1 className="page-title">{plant.name}의 흙 레시피</h1>
      <p className="page-sub">지금 쓰는 배합을 남겨두면, 어떤 흙이 잘 맞았는지 비교할 수 있어요.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>배합한 날 (분갈이 날)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="field">
          <label>배합 비율 — 합계 {total}%</label>
          {ingredients.map((ing, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={ing.name}
                onChange={(e) => setIngredient(idx, 'name', e.target.value)}
                placeholder="재료 이름"
                style={{ flex: 1 }}
              />
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                value={ing.pct}
                onChange={(e) => setIngredient(idx, 'pct', e.target.value)}
                placeholder="%"
                style={{ width: 72 }}
              />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeIngredient(idx)}>
                ✕
              </button>
            </div>
          ))}
          {total !== 100 && total > 0 && (
            <div className="muted" style={{ marginBottom: 8 }}>
              합계가 100%가 아니어도 저장할 수 있어요.
            </div>
          )}
          <div className="chips">
            {COMMON_INGREDIENTS.filter((n) => !ingredients.some((i) => i.name === n)).map((n) => (
              <button key={n} type="button" className="chip" onClick={() => addIngredient(n)}>
                + {n}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => addIngredient()}>
              + 직접 입력
            </button>
          </div>
        </div>

        <div className="field">
          <label>이 레시피, 어땠나요?</label>
          <Stars value={rating} onChange={setRating} />
          <div className="muted">아직 모르겠다면 비워두고, 나중에 식물 카드에서 평가할 수 있어요.</div>
        </div>

        <div className="field">
          <label>메모</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 새잎 잘 남. 물빠짐 좋아짐." />
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          레시피 저장
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate(-1)} style={{ marginTop: 8 }}>
          취소
        </button>
      </form>
    </div>
  );
}
