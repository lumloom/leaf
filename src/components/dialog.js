// 앱 자체 확인/알림 다이얼로그.
// iOS 홈 화면 PWA(standalone)에서는 window.confirm/alert가 표시되지 않으므로
// 브라우저 기본 창 대신 이 모듈을 통해 DialogHost가 그려주는 창을 쓴다.

let host = null;

export function registerDialogHost(fn) {
  host = fn;
  return () => {
    if (host === fn) host = null;
  };
}

// 확인/취소 → true/false
export function appConfirm(message, { confirmLabel = '확인', danger = false } = {}) {
  if (!host) return Promise.resolve(window.confirm(message)); // 호스트 미장착 시 폴백
  return new Promise((resolve) => host({ type: 'confirm', message, confirmLabel, danger, resolve }));
}

// 알림 → 닫으면 resolve
export function appAlert(message) {
  if (!host) {
    window.alert(message);
    return Promise.resolve();
  }
  return new Promise((resolve) => host({ type: 'alert', message, resolve }));
}
