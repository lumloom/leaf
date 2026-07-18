import { Link } from 'react-router-dom';
import PhotoImg from './PhotoImg.jsx';
import { wateringDday, newLeafCountThisMonth } from '../data/plantUtils.js';

export default function PlantCard({ plant, space, events }) {
  const dday = wateringDday(events, plant);
  const newLeaves = newLeafCountThisMonth(events, plant.id);

  return (
    <Link to={`/plants/${plant.id}`} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <PhotoImg
        photoId={plant.photoId}
        alt={plant.name}
        style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-round)', fontSize: 16 }}>{plant.name}</div>
        <div className="muted" style={{ marginTop: 2 }}>
          {space ? space.name : '위치 미지정'}
          {plant.species ? ` · ${plant.species}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {dday !== null && (
            <span className="badge badge-water">
              {dday < 0 ? `물주기 ${-dday}일 지남` : dday === 0 ? '오늘 물주기' : `물주기 D-${dday}`}
            </span>
          )}
          {newLeaves > 0 && <span className="badge">🌱 새잎 +{newLeaves}</span>}
        </div>
      </div>
      <span style={{ color: 'var(--color-text-secondary)' }}>›</span>
    </Link>
  );
}
