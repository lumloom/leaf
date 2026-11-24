import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import PlantCard from '../components/PlantCard.jsx';
import { wateringDday } from '../data/plantUtils.js';

export default function Home() {
  const { plants: allPlants, spaces, events } = useStore();
  const plants = allPlants.filter((p) => !p.archived);
  const memoriesCount = allPlants.length - plants.length;

  const todos = plants
    .map((p) => ({ plant: p, dday: wateringDday(events, p) }))
    .filter((t) => t.dday !== null && t.dday <= 0);

  return (
    <div className="page home-page">
      <header className="home-intro">
        <div>
          <h1 className="page-title">🌿 우리집 식물</h1>
          <p className="page-sub">A place where plants grow, and memories grow with them.</p>
        </div>
        <picture className="home-pencil-art">
          <source media="(min-width: 900px)" srcSet="./leaf-crayon-pots-desktop.png" />
          <img
            className="home-pencil-illustration"
            src="./leaf-crayon-pots-mobile.png"
            alt="크레용으로 그린 여러 화분과 식물"
          />
        </picture>
      </header>

      {plants.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🪴</div>
          아직 등록된 식물이 없어요.
          <br />
          첫 식물을 맞이해 볼까요?
        </div>
      ) : (
        <div className="home-plant-grid">
          {plants.map((p) => (
            <PlantCard key={p.id} plant={p} space={spaces.find((s) => s.id === p.spaceId)} events={events} />
          ))}
        </div>
      )}

      <div className="home-actions">
        <Link to="/plants/new" className="btn btn-primary btn-block">
          + 새 식물 맞이하기
        </Link>
        <Link to="/memories" className="btn btn-ghost btn-block">
          🕊️ 추억보기{memoriesCount > 0 ? ` (${memoriesCount})` : ''}
        </Link>
      </div>

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
