import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import PlantCard from '../components/PlantCard.jsx';

// 추억으로 보낸 식물들 — 식물 탭과 같은 카드 형태로, 기록은 그대로 보존
export default function Memories() {
  const navigate = useNavigate();
  const { plants, spaces, events } = useStore();
  const archived = plants.filter((p) => p.archived);

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
        ‹ 뒤로
      </button>
      <h1 className="page-title">🕊️ 추억보기</h1>
      <p className="page-sub">함께했던 시간은 여기 그대로 남아있어요.</p>

      {archived.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🕊️</div>
          아직 추억으로 보낸 식물이 없어요.
        </div>
      ) : (
        archived.map((p) => (
          <PlantCard key={p.id} plant={p} space={spaces.find((s) => s.id === p.spaceId)} events={events} />
        ))
      )}
    </div>
  );
}
