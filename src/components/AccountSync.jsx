import { useState, useSyncExternalStore } from 'react';
import {
  getSyncSnapshot,
  requestLogin,
  resolveConflict,
  runSync,
  signOut,
  subscribeSync,
  updatePassword,
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
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function login(event) {
    event.preventDefault();
    if (await requestLogin(email.trim(), password)) setPassword('');
  }

  async function savePassword(event) {
    event.preventDefault();
    if (await updatePassword(newPassword)) setNewPassword('');
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
          <label>
            <span>비밀번호</span>
            <input type="password" autoComplete="current-password" minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8자 이상" />
          </label>
          <button className="btn btn-primary" disabled={sync.busy}>
            {sync.busy ? '로그인 중…' : '로그인'}
          </button>
          <small className="muted">같은 Lumloom 이메일과 비밀번호를 네 기기에서 사용해요. <a href="https://lumloom.github.io/account.html" target="_blank" rel="noreferrer">계정 만들기·비밀번호 찾기</a></small>
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
          <details className="account-password-settings">
            <summary>비밀번호 설정·변경</summary>
            <form onSubmit={savePassword}>
              <label><span>새 비밀번호</span><input type="password" autoComplete="new-password" minLength="8" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="8자 이상" /></label>
              <button className="btn" type="submit" disabled={sync.busy}>저장</button>
            </form>
            <small className="muted">한 앱에서 설정한 비밀번호를 모든 Lumloom 앱에서 사용해요.</small>
          </details>
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
