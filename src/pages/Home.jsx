import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import PlantCard from '../components/PlantCard.jsx';
import { wateringDday } from '../data/plantUtils.js';

export default function Home() {
  const { plants, spaces, events } = useStore();

  const todos = plants
    .map((p) => ({ plant: p, dday: wateringDday(events, p) }))
    .filter((t) => t.dday !== null && t.dday <= 0);

  return (
    <div className="page">
      <h1 className="page-title">🌿 우리집 식물</h1>
      <p className="page-sub">A place where plants grow, and memories grow with them.</p>

      {plants.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🪴</div>
          아직 등록된 식물이 없어요.
          <br />
          첫 식물을 맞이해 볼까요?
        </div>
      ) : (
        plants.map((p) => (
          <PlantCard key={p.id} plant={p} space={spaces.find((s) => s.id === p.spaceId)} events={events} />
        ))
      )}

      <Link to="/plants/new" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
        + 새 식물 맞이하기
      </Link>

      {todos.length > 0 && (
        <>
          <h2 className="section-title">오늘 해야 할 일</h2>
          <div className="card">
            {todos.map(({ plant, dday }) => (
              <Link
                key={plant.id}
                to={`/plants/${plant.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}
              >
                <span>💧 {plant.name} 물주기</span>
                <span className="muted">{dday < 0 ? `${-dday}일 지남` : '오늘'}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
