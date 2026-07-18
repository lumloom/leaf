import { useRef, useState } from 'react';
import { resetAll } from '../data/db.js';
import { clearPhotos } from '../data/photoStore.js';
import { exportBackupZip, importBackupZip, downloadBlob } from '../data/exportMd.js';
import { todayIso } from '../data/plantUtils.js';
import { useStore } from '../hooks/useStore.js';
import { appConfirm, appAlert } from '../components/dialog.js';

export default function Settings() {
  const { plants, spaces, events } = useStore();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportBackupZip();
      downloadBlob(blob, `lumloom-leaf-backup-${todayIso()}.zip`);
    } catch (err) {
      await appAlert(`백업을 만들지 못했어요: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ok = await appConfirm('백업을 불러오면 지금 앱에 있는 모든 데이터가 백업 내용으로 교체돼요.\n계속할까요?', {
      confirmLabel: '불러오기',
    });
    if (!ok) return;
    setImporting(true);
    try {
      const result = await importBackupZip(file);
      await appAlert(`복원 완료! 식물 ${result.plants}개 · 공간 ${result.spaces}곳 · 기록 ${result.events}개를 불러왔어요 🌿`);
    } catch (err) {
      await appAlert(`백업을 불러오지 못했어요: ${err.message}`);
    } finally {
      setImporting(false);
    }
  }

  async function handleReset() {
    const ok = await appConfirm('모든 식물·공간·기록·사진이 삭제됩니다.\n정말 비울까요?', {
      confirmLabel: '전부 삭제',
      danger: true,
    });
    if (ok) {
      resetAll();
      await clearPhotos();
      await appAlert('모든 데이터를 비웠어요. 새 마음으로 시작해요 🌱');
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">⚙️ 설정</h1>
      <p className="page-sub">Lumloom Leaf</p>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-round)', marginBottom: 8 }}>지금까지의 기록</div>
        <div className="muted">
          식물 {plants.length}개 · 공간 {spaces.length}곳 · 기록 {events.length}개
        </div>
        <div className="muted" style={{ marginTop: 4 }}>
          모든 데이터는 이 기기 안에만 저장돼요.
        </div>
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-round)', marginBottom: 8 }}>백업</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          식물마다 마크다운 노트 하나씩, 사진·데이터와 함께 ZIP으로 내려받아요. 받아둔 ZIP으로 언제든
          그대로 복원할 수 있어요.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting || plants.length === 0}>
            {exporting ? '백업 만드는 중…' : '📦 백업 다운로드'}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? '불러오는 중…' : '📥 백업 불러오기'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".zip,application/zip" hidden onChange={handleImportFile} />
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-round)', marginBottom: 8 }}>데이터 초기화</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          예시 데이터를 포함해 모든 기록을 지우고 빈 상태에서 시작해요.
        </div>
        <button className="btn btn-danger" onClick={handleReset}>
          모든 데이터 비우기
        </button>
      </div>

      <p className="muted brand-title" style={{ textAlign: 'center', marginTop: 32 }}>
        Lumloom — We weave brighter days.
      </p>
    </div>
  );
}
