import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { wateringDday } from '../data/plantUtils.js';
import PlantCard from '../components/PlantCard.jsx';
import QuickLogModal from '../components/QuickLogModal.jsx';
import Icon from '../components/Icon.jsx';

export default function Plants() {
  const { plants: allPlants, spaces, events } = useStore();
  const plants = allPlants.filter((plant) => !plant.archived);
  const [query, setQuery] = useState('');
  const [spaceId, setSpaceId] = useState('all');
  const [careOnly, setCareOnly] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('ko');
    return plants.filter((plant) => {
      const matchesText = !term || [plant.name, plant.species, spaces.find((space) => space.id === plant.spaceId)?.name].filter(Boolean).some((value) => value.toLocaleLowerCase('ko').includes(term));
      const matchesSpace = spaceId === 'all' || plant.spaceId === spaceId;
      const dday = wateringDday(events, plant);
      return matchesText && matchesSpace && (!careOnly || (dday !== null && dday <= 0));
    });
  }, [careOnly, events, plants, query, spaceId, spaces]);

  return (
    <main className="page collection-page">
      {savedNotice && <div className="toast" role="status">{savedNotice}</div>}
      <div className="page-heading-row"><div><span className="eyebrow">MY GREEN FAMILY</span><h1 className="page-title">우리집 식물</h1><p className="page-sub">각자의 속도로 자라는 초록 친구들을 한눈에 살펴보세요.</p></div><div className="page-heading-actions"><button className="btn" onClick={() => setQuickLogOpen(true)} disabled={!plants.length}><Icon name="journal" size={18} />빠른 기록</button><Link to="/plants/new" className="btn btn-primary"><Icon name="plus" size={18} />새 식물</Link></div></div>
      <section className="collection-tools" aria-label="식물 검색과 필터">
        <label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 품종, 공간으로 검색" /><span className="sr-only">식물 검색</span></label>
        <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} aria-label="공간 필터"><option value="all">모든 공간</option>{spaces.map((space) => <option value={space.id} key={space.id}>{space.name}</option>)}</select>
        <button className={`filter-toggle ${careOnly ? 'active' : ''}`} onClick={() => setCareOnly((value) => !value)} aria-pressed={careOnly}><Icon name="droplet" size={17} />돌봄 필요</button>
      </section>
      {visible.length ? <div className="plant-grid collection-grid">{visible.map((plant) => <PlantCard key={plant.id} plant={plant} space={spaces.find((space) => space.id === plant.spaceId)} events={events} />)}</div> : <div className="empty-panel"><Icon name="search" size={34} /><h3>{plants.length ? '조건에 맞는 식물이 없어요.' : '아직 등록된 식물이 없어요.'}</h3><p>{plants.length ? '검색어나 필터를 조금 바꿔보세요.' : '첫 식물의 이름과 사진부터 남겨보세요.'}</p>{!plants.length && <Link to="/plants/new" className="btn btn-primary">식물 등록하기</Link>}</div>}
      {quickLogOpen && <QuickLogModal plants={plants} onClose={() => setQuickLogOpen(false)} onSaved={() => { setSavedNotice('정원 기록에 고이 남겼어요.'); window.setTimeout(() => setSavedNotice(''), 2600); }} />}
    </main>
  );
}
