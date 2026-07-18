import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { plants, events } from '../data/db.js';
import { EVENT_TYPES } from '../data/labels.js';
import { todayIso } from '../data/plantUtils.js';
import PhotoInput from '../components/PhotoInput.jsx';

// 식물 일기 + 관리 기록 작성/수정. 종류를 고르고 글과 사진을 남긴다.
export default function LogForm() {
  const { id, eventId } = useParams();
  const navigate = useNavigate();
  const plant = plants.get(id);
  const editing = eventId ? events.all().find((e) => e.id === eventId) : null;

  const [type, setType] = useState(editing?.type ?? 'diary');
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [text, setText] = useState(editing?.text ?? '');
  const [photoId, setPhotoId] = useState(editing?.photoIds?.[0] ?? null);

  if (!plant) {
    return (
      <div className="page">
        <div className="empty">식물을 찾을 수 없어요.</div>
      </div>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    events.save({
      ...(editing ?? {}),
      plantId: plant.id,
      type,
      date,
      text: text.trim(),
      photoIds: photoId ? [photoId] : [],
    });
    navigate(`/plants/${plant.id}`, { replace: true });
  }

  return (
    <div className="page">
      <h1 className="page-title">{editing ? '기록 수정' : `${plant.name}의 기록`}</h1>
      <p className="page-sub">
        {editing ? '남겨둔 기록을 다듬어요.' : '오늘의 순간을 남겨두면, 시간이 지나 이야기가 돼요.'}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>기록 종류</label>
          <div className="chips">
            {Object.entries(EVENT_TYPES)
              .filter(([key]) => key !== 'photo')
              .map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`chip ${type === key ? 'selected' : ''}`}
                  onClick={() => setType(key)}
                >
                  {meta.icon} {meta.label}
                </button>
              ))}
          </div>
        </div>

        <div className="field">
          <label>날짜</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="field">
          <label>내용</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === 'pest'
                ? '예: 응애 발견, 비오킬 사용. 잎 뒷면 위주로.'
                : type === 'newleaf'
                  ? '예: 새잎 하나 발견! 색이 연하고 부드럽다.'
                  : '예: 오늘 잎이 조금 처짐. 환기 후 괜찮아진 듯.'
            }
          />
        </div>

        <div className="field">
          <label>사진</label>
          <PhotoInput photoId={photoId} onChange={setPhotoId} />
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          {editing ? '수정 저장' : '기록 남기기'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate(-1)} style={{ marginTop: 8 }}>
          취소
        </button>
      </form>
    </div>
  );
}
