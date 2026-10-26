import { useState, useSyncExternalStore } from 'react';
import {
  getSyncSnapshot,
  requestLogin,
  resolveConflict,
  runSync,
  signOut,
  subscribeSync,
} from '../data/sync.js';

const typeLabel = {
  spaces: '공간',
  plants: '식물',
  events: '기록',
  soilRecipes: '흙 배합',
};

export default function AccountSync() {
  const sync = useSyncExternalStore(subscribeSync, getSyncSnapshot);
  const [email, setEmail] = useState('');

  async function login(event) {
    event.preventDefault();
    if (await requestLogin(email.trim())) setEmail('');
  }

  return (
    <div className="card account-sync-card">
      <div className="account-sync-heading">
        <div>
          <div className="account-sync-kicker">LUMLOOM ACCOUNT</div>
          <h2>계정과 동기화</h2>
        </div>
        <span className={`account-sync-dot ${sync.signedIn ? 'online' : ''}`} aria-hidden="true" />
      </div>
      <p className="muted account-sync-lead">
        같은 계정으로 로그인하면 데스크탑, 아이패드, 아이폰에서 식물과 돌봄 기록을 이어서 볼 수 있어요.
      </p>

      {!sync.signedIn ? (
        <form className="account-sync-login" onSubmit={login}>
          <label>
            <span>이메일</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <button className="btn btn-primary" disabled={sync.busy}>
            {sync.busy ? '보내는 중…' : '로그인 링크 받기'}
          </button>
          <small className="muted">메일함에서 가장 최근 Lumloom 로그인 링크를 눌러주세요.</small>
        </form>
      ) : (
        <div className="account-sync-session">
          <div className="account-sync-email">
            <span className="muted">로그인한 계정</span>
            <strong>{sync.email}</strong>
            <button className="account-sync-text-button" type="button" onClick={() => void signOut()}>로그아웃</button>
          </div>
          <div className="account-sync-summary">
            <div><strong>{sync.localCount}</strong><span>이 기기 기록</span></div>
            <div><strong>{sync.cloudCount}</strong><span>클라우드 기록</span></div>
            <div><strong>{sync.conflicts.length}</strong><span>확인할 충돌</span></div>
          </div>
          <div className="account-sync-actions">
            <button className="btn btn-primary" disabled={sync.busy} onClick={() => void runSync(false)}>지금 동기화</button>
            <button className="btn" disabled={sync.busy || !sync.localCount || !sync.pendingCount} onClick={() => void runSync(true)}>
              {!sync.localCount ? '올릴 기록 없음' : sync.pendingCount ? '기존 기록 올리기' : '모두 업로드됨'}
            </button>
          </div>
          {sync.conflicts.map((conflict) => {
            const [entityType] = conflict.key.split(':');
            return (
              <div className="account-sync-conflict" key={conflict.key}>
                <strong>{typeLabel[entityType] || entityType}</strong>
                <span>이 기기와 클라우드에서 모두 변경되었어요.</span>
                <div>
                  <button type="button" onClick={() => void resolveConflict(conflict.key, 'local')}>이 기기 사용</button>
                  <button type="button" onClick={() => void resolveConflict(conflict.key, 'remote')}>클라우드 사용</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sync.message && <p className={`account-sync-message ${sync.error ? 'error' : ''}`} role="status">{sync.message}</p>}
    </div>
  );
}
