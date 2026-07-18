import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { spaces } from '../data/db.js';
import { LIGHT_OPTIONS, AIRFLOW_OPTIONS, DIRECTION_OPTIONS } from '../data/labels.js';
import { appConfirm } from '../components/dialog.js';

export default function SpaceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id ? spaces.get(id) : null;

  const [form, setForm] = useState(
    editing ?? { name: '', direction: '', light: '', directSunHours: '', airflow: '', notes: '' }
  );
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    spaces.save({
      ...form,
      name: form.name.trim(),
      directSunHours: form.directSunHours === '' ? null : Number(form.directSunHours),
    });
    navigate('/spaces', { replace: true });
  }

  async function handleDelete() {
    const ok = await appConfirm(`'${form.name}' 공간을 삭제할까요?\n이 공간의 식물은 '위치 미지정'이 돼요.`, {
      confirmLabel: '삭제',
      danger: true,
    });
    if (ok) {
      spaces.remove(id);
      navigate('/spaces', { replace: true });
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">{editing ? '공간 수정' : '공간 등록'}</h1>
      <p className="page-sub">이 공간의 빛과 바람은 어떤가요?</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>공간 이름 *</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 거실 창가" required />
        </div>

        <div className="field">
          <label>방향</label>
          <div className="chips">
            {DIRECTION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`chip ${form.direction === d ? 'selected' : ''}`}
                onClick={() => set('direction', d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>광량</label>
          <div className="chips">
            {LIGHT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${form.light === o.value ? 'selected' : ''}`}
                onClick={() => set('light', o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>직사광선 시간 (시간/일)</label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="12"
            value={form.directSunHours ?? ''}
            onChange={(e) => set('directSunHours', e.target.value)}
            placeholder="예: 3"
          />
        </div>

        <div className="field">
          <label>통풍</label>
          <div className="chips">
            {AIRFLOW_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`chip ${form.airflow === o.value ? 'selected' : ''}`}
                onClick={() => set('airflow', o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>메모</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="예: 에어컨 바람이 직접 닿음, 겨울엔 추움"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          저장하기
        </button>
        {editing && (
          <button type="button" className="btn btn-danger btn-block" style={{ marginTop: 8 }} onClick={handleDelete}>
            공간 삭제
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate(-1)} style={{ marginTop: 8 }}>
          취소
        </button>
      </form>
    </div>
  );
}
