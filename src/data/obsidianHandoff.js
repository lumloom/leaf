const SUCCESS_PARAM = 'lumloom_obsidian_saved';

export const OBSIDIAN_RETURN_MESSAGE =
  'Obsidian으로 저장 요청을 보냈습니다. Lumloom Vault의 01. 수집함을 확인해 주세요. Vault가 없거나 이름이 다르면 저장되지 않을 수 있습니다.';

export function beginObsidianHandoff(storageKey) {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, token);
  const callbackUrl = new URL(window.location.href);
  callbackUrl.searchParams.set(SUCCESS_PARAM, token);
  return { token, successUrl: callbackUrl.toString() };
}

export function cancelObsidianHandoff(storageKey, token) {
  if (localStorage.getItem(storageKey) === token) localStorage.removeItem(storageKey);
}

export function consumeObsidianSuccess(storageKey) {
  const currentUrl = new URL(window.location.href);
  const token = currentUrl.searchParams.get(SUCCESS_PARAM);
  if (!token) return false;
  const confirmed = localStorage.getItem(storageKey) === token;
  if (confirmed) localStorage.removeItem(storageKey);
  currentUrl.searchParams.delete(SUCCESS_PARAM);
  window.history.replaceState(window.history.state, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
  return confirmed;
}

export function watchObsidianHandoff(storageKey, token, onReturnNotice) {
  let departed = false;
  let settled = false;
  const pending = () => localStorage.getItem(storageKey) === token;
  const cleanup = () => {
    window.removeEventListener('blur', onDepart);
    window.removeEventListener('focus', onReturn);
    document.removeEventListener('visibilitychange', onVisibility);
  };
  const finish = () => {
    if (settled) return;
    settled = true;
    cleanup();
    if (!pending()) return;
    localStorage.removeItem(storageKey);
    onReturnNotice();
  };
  const onDepart = () => { departed = true; };
  const onReturn = () => { if (departed) window.setTimeout(finish, 500); };
  const onVisibility = () => (document.hidden ? onDepart() : onReturn());
  window.addEventListener('blur', onDepart);
  window.addEventListener('focus', onReturn);
  document.addEventListener('visibilitychange', onVisibility);
  window.setTimeout(() => { if (!departed && !document.hidden) finish(); }, 8000);
}
