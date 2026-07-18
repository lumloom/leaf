import { useRef, useState } from 'react';
import { savePhoto } from '../data/photoStore.js';
import PhotoImg from './PhotoImg.jsx';

// 사진 선택 → 리사이즈 후 IndexedDB 저장 → photoId 반환
export default function PhotoInput({ photoId, onChange, height = 160 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const id = await savePhoto(file);
      onChange(id);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%',
          height,
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--color-surface)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {photoId ? (
          <PhotoImg photoId={photoId} alt="선택한 사진" style={{ width: '100%', height: '100%' }} />
        ) : (
          <span className="muted">{busy ? '저장 중…' : '📷 사진 추가 (탭해서 선택)'}</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      {photoId && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
          사진 지우기
        </button>
      )}
    </div>
  );
}
