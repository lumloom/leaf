import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { getPhotoBlob } from '../data/photoStore.js';
import { formatDate } from '../data/plantUtils.js';

// 타임라인에 남긴 사진들을 시간순으로 모아 Before/After 슬라이더로 비교한다.
export default function Compare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants, events } = useStore();
  const plant = plants.find((p) => p.id === id);

  // 이 식물의 모든 사진을 (날짜, photoId)로 평탄화
  const photos = useMemo(
    () =>
      events
        .filter((e) => e.plantId === id && e.photoIds?.length > 0)
        .flatMap((e) => e.photoIds.map((pid) => ({ photoId: pid, date: e.date })))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, id]
  );

  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(Math.max(0, photos.length - 1));
  const [pos, setPos] = useState(50); // 슬라이더 위치 %

  if (!plant) {
    return (
      <div className="page">
        <div className="empty">식물을 찾을 수 없어요.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
        ‹ 뒤로
      </button>
      <h1 className="page-title">{plant.name}의 성장 비교</h1>
      <p className="page-sub">사진 두 장을 골라 Before / After를 겹쳐 보세요.</p>

      {photos.length < 2 ? (
        <div className="empty">
          <div className="empty-icon">📷</div>
          비교하려면 사진이 두 장 이상 필요해요.
          <br />
          타임라인에 사진을 함께 남겨보세요.
        </div>
      ) : (
        <>
          <div className="field-row">
            <div className="field">
              <label>Before</label>
              <select value={beforeIdx} onChange={(e) => setBeforeIdx(Number(e.target.value))}>
                {photos.map((p, i) => (
                  <option key={i} value={i}>
                    {formatDate(p.date)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>After</label>
              <select value={afterIdx} onChange={(e) => setAfterIdx(Number(e.target.value))}>
                {photos.map((p, i) => (
                  <option key={i} value={i}>
                    {formatDate(p.date)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CompareViewer
            beforeId={photos[beforeIdx]?.photoId}
            afterId={photos[afterIdx]?.photoId}
            beforeLabel={formatDate(photos[beforeIdx]?.date)}
            afterLabel={formatDate(photos[afterIdx]?.date)}
            pos={pos}
          />

          <input
            type="range"
            min="0"
            max="100"
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            style={{ width: '100%', marginTop: 12, accentColor: 'var(--color-accent)' }}
            aria-label="비교 슬라이더"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
            <span>Before</span>
            <span>After</span>
          </div>
        </>
      )}
    </div>
  );
}

function useBlobUrl(photoId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    setUrl(null);
    if (photoId) {
      getPhotoBlob(photoId).then((blob) => {
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      });
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);
  return url;
}

function CompareViewer({ beforeId, afterId, beforeLabel, afterLabel, pos }) {
  const beforeUrl = useBlobUrl(beforeId);
  const afterUrl = useBlobUrl(afterId);

  const imgStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--color-surface-alt)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* After가 바닥, Before가 위에서 왼쪽 pos%만큼 보임 */}
      {afterUrl && <img src={afterUrl} alt={`After ${afterLabel}`} style={imgStyle} />}
      {beforeUrl && (
        <img
          src={beforeUrl}
          alt={`Before ${beforeLabel}`}
          style={{ ...imgStyle, clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${pos}%`,
          width: 2,
          background: '#fff',
          boxShadow: '0 0 6px rgba(0,0,0,0.35)',
        }}
      />
      <span style={labelStyle('left')}>{beforeLabel}</span>
      <span style={labelStyle('right')}>{afterLabel}</span>
    </div>
  );
}

const labelStyle = (side) => ({
  position: 'absolute',
  bottom: 10,
  [side]: 10,
  background: 'rgba(46, 44, 40, 0.55)',
  color: '#fff',
  fontSize: 12,
  padding: '3px 9px',
  borderRadius: 999,
  fontFamily: 'var(--font-round)',
});
