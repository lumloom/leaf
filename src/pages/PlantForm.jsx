import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { plants } from '../data/db.js';
import { useStore } from '../hooks/useStore.js';
import { LIGHT_OPTIONS, AIRFLOW_OPTIONS, POT_MATERIAL_OPTIONS } from '../data/labels.js';
import { rankSpaces } from '../data/match.js';
import PhotoInput from '../components/PhotoInput.jsx';
import Stars from '../components/Stars.jsx';

// 식물 등록/수정 폼. 선호 환경을 입력하면 등록된 공간 중 추천 위치를 별점으로 보여준다.
export default function PlantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { spaces } = useStore();
  const editing = id ? plants.get(id) : null;

  const [form, setForm] = useState(
    editing ?? {
      name: '',
      species: '',
      photoId: null,
      acquiredAt: '',
      birthday: '',
      price: '',
      source: '',
      spaceId: '',
      potSize: '',
      potMaterial: '',
      notes: '',
      prefs: { light: '', airflow: '' },
      wateringIntervalDays: '',
    }
  );

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setPref = (key, value) => setForm((f) => ({ ...f, prefs: { ...f.prefs, [key]: value } }));

  const recommendations = rankSpaces(form.prefs, spaces);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const saved = plants.save({
      ...form,
      name: form.name.trim(),
      wateringIntervalDays: form.wateringIntervalDays ? Number(form.wateringIntervalDays) : null,
    });
    navigate(`/plants/${saved.id}`, { replace: true });
  }

  return (
    <div className="page">
      <h1 className="page-title">{editing ? '식물 정보 수정' : '새 식물 맞이하기'}</h1>
      <p className="page-sub">우리집에 온 식물의 이야기를 시작해요.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>사진</label>
          <PhotoInput photoId={form.photoId} onChange={(pid) => set('photoId', pid)} />
        </div>

        <div className="field-row">
          <div className="field">
            <label>이름 *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 파키라" required />
          </div>
          <div className="field">
            <label>품종</label>
            <input value={form.species} onChange={(e) => set('species', e.target.value)} placeholder="예: 파키라 아쿠아티카" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>우리집에 온 날</label>
            <input type="date" value={form.acquiredAt ?? ''} onChange={(e) => set('acquiredAt', e.target.value)} />
          </div>
          <div className="field">
            <label>구매가격 (선택)</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value)}
              placeholder="원"
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>구매처</label>
            <input value={form.source ?? ''} onChange={(e) => set('source', e.target.value)} placeholder="예: 동네 꽃집" />
          </div>
          <div className="field">
            <label>생일 (선택)</label>
            <input type="date" value={form.birthday ?? ''} onChange={(e) => set('birthday', e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>화분 크기</label>
            <input value={form.potSize ?? ''} onChange={(e) => set('potSize', e.target.value)} placeholder="예: 4호" />
          </div>
          <div className="field">
            <label>화분 재질</label>
            <select value={form.potMaterial ?? ''} onChange={(e) => set('potMaterial', e.target.value)}>
              <option value="">선택</option>
              {POT_MATERIAL_OPTIONS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>물주기 주기 (일)</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={form.wateringIntervalDays ?? ''}
            onChange={(e) => set('wateringIntervalDays', e.target.value)}
            placeholder="예: 7 — 홈 화면에 D-day로 표시돼요"
          />
        </div>

        <h2 className="section-title">이 식물이 좋아하는 환경</h2>
        <div className="field">
          <label>광량</label>
          <div className="chips">
            {LIGHT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${form.prefs.light === o.value ? 'selected' : ''}`}
                onClick={() => setPref('light', o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>통풍</label>
          <div className="chips">
            {AIRFLOW_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${form.prefs.airflow === o.value ? 'selected' : ''}`}
                onClick={() => setPref('airflow', o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="card" style={{ background: 'var(--color-surface-alt)', border: 'none' }}>
            <div style={{ fontFamily: 'var(--font-round)', marginBottom: 8 }}>🧭 추천 위치</div>
            {recommendations.map(({ space, score }) => (
              <button
                key={space.id}
                type="button"
                onClick={() => set('spaceId', space.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: form.spaceId === space.id ? 'var(--color-surface)' : 'transparent',
                }}
              >
                <span>{space.name}</span>
                <Stars value={score} />
              </button>
            ))}
            <div className="muted" style={{ marginTop: 6 }}>
              탭하면 그 위치로 지정돼요.
            </div>
          </div>
        )}

        <div className="field" style={{ marginTop: 16 }}>
          <label>현재 위치</label>
          <select value={form.spaceId ?? ''} onChange={(e) => set('spaceId', e.target.value)}>
            <option value="">위치 미지정</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>식물 메모</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="이 식물만의 이야기, 특징을 남겨두세요."
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          {editing ? '저장하기' : '우리집 식구로 등록'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate(-1)} style={{ marginTop: 8 }}>
          취소
        </button>
      </form>
    </div>
  );
}
