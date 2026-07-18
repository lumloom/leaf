import { useEffect, useState } from 'react';
import { registerDialogHost } from './dialog.js';

// appConfirm/appAlert 요청을 받아 화면에 다이얼로그를 그리는 호스트 (App에 한 번만 장착)
export default function DialogHost() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => registerDialogHost(setDialog), []);

  if (!dialog) return null;

  const close = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };

  return (
    <div className="dialog-overlay" onClick={() => close(dialog.type === 'confirm' ? false : undefined)}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <p style={{ whiteSpace: 'pre-wrap' }}>{dialog.message}</p>
        <div className="dialog-actions">
          {dialog.type === 'confirm' && (
            <button className="btn" onClick={() => close(false)}>
              취소
            </button>
          )}
          <button
            className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => close(dialog.type === 'confirm' ? true : undefined)}
          >
            {dialog.type === 'confirm' ? dialog.confirmLabel : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}
