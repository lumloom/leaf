import { useEffect, useState } from 'react';
import { getPhotoBlob } from '../data/photoStore.js';

// IndexedDB에 저장된 사진을 object URL로 변환해 표시
export default function PhotoImg({ photoId, alt = '', className, style }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
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

  if (!photoId || !url) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface-alt)',
          color: 'var(--color-accent)',
          fontSize: 26,
        }}
        aria-label={alt}
      >
        🌿
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} style={{ ...style, objectFit: 'cover' }} />;
}
