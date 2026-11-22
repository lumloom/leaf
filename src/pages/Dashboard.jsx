import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore.js';
import { EVENT_TYPES } from '../data/labels.js';
import { formatDate, todayIso, wateringDday } from '../data/plantUtils.js';
import PlantCard from '../components/PlantCard.jsx';
import PhotoImg from '../components/PhotoImg.jsx';
import QuickLogModal from '../components/QuickLogModal.jsx';
import Icon from '../components/Icon.jsx';

export default function Dashboard() {
  const { plants: allPlants, spaces, events } = useStore();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');
  const plants = allPlants.filter((plant) => !plant.archived);
  const plantById = useMemo(() => Object.fromEntries(plants.map((plant) => [plant.id, plant])), [plants]);
  const care = plants.map((plant) => ({ plant, dday: wateringDday(events, plant) })).filter(({ dday }) => dday !== null && dday <= 0).sort((a, b) => a.dday - b.dday);
  const featuredPlants = useMemo(() => {
    const latestEventByPlant = new Map();
    events.forEach((event) => {
      if (!plantById[event.plantId]) return;
      const eventOrder = `${event.date}|${event.createdAt ?? ''}`;
      if (eventOrder > (latestEventByPlant.get(event.plantId) ?? '')) latestEventByPlant.set(event.plantId, eventOrder);
    });
    return [...plants]
      .sort((a, b) => {
        const eventOrder = (latestEventByPlant.get(b.id) ?? '').localeCompare(latestEventByPlant.get(a.id) ?? '');
        if (eventOrder) return eventOrder;
        return (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? '');
      })
      .slice(0, 4);
  }, [events, plantById, plants]);
  const recent = [...events].filter((event) => plantById[event.plantId]).sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5);
  const recentByDate = recent.reduce((groups, event) => {
    (groups[event.date] ??= []).push(event);
    return groups;
  }, {});
  const month = todayIso().slice(0, 7);
  const newLeaves = events.filter((event) => event.type === 'newleaf' && event.date.startsWith(month)).length;

  function showSaved() {
    setSavedNotice('정원 기록에 고이 남겼어요.');
    window.setTimeout(() => setSavedNotice(''), 2600);
  }

  return (
    <main className="page dashboard-page">
      {savedNotice && <div className="toast" role="status">{savedNotice}</div>}
      <section className="garden-hero">
        <div className="hero-copy"><span className="eyebrow">MY GROWING DAYS</span><h1>오늘도 초록이와<br />함께 자라고 있어요.</h1><p>돌봄의 순간과 작은 변화를 한곳에서 천천히 이어가세요.</p><div className="hero-actions"><Link to="/plants/new" className="btn btn-primary"><Icon name="plus" size={18} />새 식물 맞이하기</Link><button className="btn btn-sun" onClick={() => setQuickLogOpen(true)} disabled={!plants.length}><Icon name="journal" size={18} />빠른 기록</button></div></div>
        <div className="hero-visual" aria-hidden="true"><span className="sun-orb"/><span className="leaf-shape leaf-one"/><span className="leaf-shape leaf-two"/><div className="hero-pot"><Icon name="sprout" size={84} /></div></div>
      </section>

      <section className="garden-summary" aria-label="정원 요약">
        <div><span className="summary-icon green"><Icon name="leaf" /></span><p>함께 사는 식물</p><strong>{plants.length}<small>개</small></strong></div>
        <div><span className="summary-icon blue"><Icon name="droplet" /></span><p>오늘의 돌봄</p><strong>{care.length}<small>건</small></strong></div>
        <div><span className="summary-icon yellow"><Icon name="sprout" /></span><p>이번 달 새잎</p><strong>{newLeaves}<small>개</small></strong></div>
        <div><span className="summary-icon coral"><Icon name="journal" /></span><p>쌓인 기록</p><strong>{events.length}<small>개</small></strong></div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-main">
          <div className="section-heading"><div><span className="eyebrow">MY PLANTS</span><h2>우리집 식물</h2></div><Link to="/plants">모두 보기 <span>→</span></Link></div>
          {plants.length ? <div className="plant-grid featured-plant-grid">{featuredPlants.map((plant) => <PlantCard key={plant.id} plant={plant} space={spaces.find((space) => space.id === plant.spaceId)} events={events} />)}</div> : <div className="empty-panel"><Icon name="sprout" size={38} /><h3>첫 식물을 맞이해 볼까요?</h3><p>사진과 이름 하나면 정원의 기록이 시작돼요.</p><Link to="/plants/new" className="btn btn-primary">식물 등록하기</Link></div>}
        </section>

        <aside className="care-panel">
          <div className="section-heading compact"><div><span className="eyebrow">TODAY</span><h2>오늘의 돌봄</h2></div><span className="care-count">{care.length}</span></div>
          {care.length ? <div className="care-list">{care.slice(0, 5).map(({ plant, dday }) => <Link to={`/plants/${plant.id}`} key={plant.id}><PhotoImg photoId={plant.photoId} alt="" /><span><strong>{plant.name}</strong><small>{dday < 0 ? `${-dday}일 늦었어요` : '오늘 물 주는 날'}</small></span><Icon name="arrow" size={17} /></Link>)}</div> : <div className="care-clear"><span><Icon name="sun" /></span><strong>오늘은 느긋해도 괜찮아요.</strong><p>예정된 물주기가 없어요.</p></div>}
        </aside>
      </div>

      <section className="recent-section">
        <div className="section-heading"><div><span className="eyebrow">RECENT MOMENTS</span><h2>최근 성장 기록</h2></div><Link to="/timeline">전체 기록 <span>→</span></Link></div>
        {recent.length ? <div className="dashboard-timeline">{Object.entries(recentByDate).map(([date, dateEvents]) => <div className="dashboard-date-group" key={date}><time>{formatDate(date)}</time><div className="dashboard-event-list">{dateEvents.map((event) => { const plant = plantById[event.plantId]; const meta = EVENT_TYPES[event.type] ?? EVENT_TYPES.diary; return <Link to={`/plants/${plant.id}`} className="dashboard-event" key={event.id}><PhotoImg photoId={plant.photoId} alt={plant.name} className="dashboard-event-plant" /><div className="dashboard-event-copy"><div><strong>{plant.name}</strong><span>{meta.icon} {meta.label}</span></div><p>{event.text || '말없이 남겨둔 돌봄의 순간'}</p></div>{event.photoIds?.length > 0 && <PhotoImg photoId={event.photoIds[0]} alt="" className="dashboard-event-photo" />}<Icon name="arrow" size={17} className="dashboard-event-arrow" /></Link>; })}</div></div>)}</div> : <div className="empty-panel inline"><Icon name="journal" /><p>아직 성장 기록이 없어요. 오늘의 작은 변화를 남겨보세요.</p></div>}
      </section>
      {quickLogOpen && <QuickLogModal plants={plants} onClose={() => setQuickLogOpen(false)} onSaved={showSaved} />}
    </main>
  );
}
