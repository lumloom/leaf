import { Link } from 'react-router-dom';
import PhotoImg from './PhotoImg.jsx';
import { wateringDday, newLeafCountThisMonth } from '../data/plantUtils.js';

export default function PlantCard({ plant, space, events }) {
  const dday = plant.archived ? null : wateringDday(events, plant);
  const newLeaves = newLeafCountThisMonth(events, plant.id);

  return (
    <Link to={`/plants/${plant.id}`} className="plant-card">
      <div className="plant-card-photo"><PhotoImg photoId={plant.photoId} alt={plant.name} /></div>
      <div className="plant-card-copy">
        <span className="plant-kicker">{space ? space.name : '위치 미지정'}</span>
        <h3>{plant.name}</h3>
        <div className="muted plant-species">
          {plant.species || '함께 자라는 우리집 식물'}
        </div>
        <div className="plant-badges">
          {dday !== null && (
            <span className="badge badge-water">
              {dday < 0 ? `물주기 ${-dday}일 지남` : dday === 0 ? '오늘 물주기' : `물주기 D-${dday}`}
            </span>
          )}
          {newLeaves > 0 && <span className="badge">🌱 새잎 +{newLeaves}</span>}
        </div>
      </div>
    </Link>
  );
}
