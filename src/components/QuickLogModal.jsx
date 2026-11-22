import { useEffect, useState } from 'react';
import { events } from '../data/db.js';
import { EVENT_TYPES } from '../data/labels.js';
import { todayIso } from '../data/plantUtils.js';
import Icon from './Icon.jsx';

const quickTypes = Object.entries(EVENT_TYPES).filter(([key]) => key !== 'photo');

export default function QuickLogModal({ plants, initialPlantId = '', onClose, onSaved }) {
  const [plantId, setPlantId] = useState(initialPlantId || plants[0]?.id || '');
  const [type, setType] = useState('water');
  const [date, setDate] = useState(todayIso());
  const [text, setText] = useState('');

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function submit(event) {
    event.preventDefault();
    if (!plantId) return;
    events.save({ plantId, type, date, text: text.trim(), photoIds: [] });
    onSaved?.();
    onClose();
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="quick-log-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="quick-log-title">
        <div className="modal-heading">
          <div><span className="eyebrow">QUICK NOTE</span><h2 id="quick-log-title">지금의 돌봄을 남겨요</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기"><Icon name="x" /></button>
        </div>
        <label className="field"><span>식물</span><select value={plantId} onChange={(e) => setPlantId(e.target.value)} required>{plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.name}</option>)}</select></label>
        <div className="field"><span>기록 종류</span><div className="quick-type-grid">{quickTypes.map(([key, meta]) => <button key={key} type="button" className={type === key ? 'selected' : ''} onClick={() => setType(key)}><span>{meta.icon}</span>{meta.label}</button>)}</div></div>
        <label className="field"><span>날짜</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label className="field"><span>짧은 메모 <small>선택</small></span><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="잎의 변화나 오늘 느낀 점을 짧게 남겨보세요." /></label>
        <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>취소</button><button className="btn btn-primary" disabled={!plantId}>기록 저장</button></div>
      </form>
    </div>
  );
}
