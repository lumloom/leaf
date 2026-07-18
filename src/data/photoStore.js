// 사진은 용량이 커서 LocalStorage 대신 IndexedDB에 Blob으로 저장한다.
// 저장 전 긴 변을 1280px로 리사이즈해 용량을 줄인다.

const DB_NAME = 'lumloom-leaf-photos';
const STORE = 'photos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

async function resizeImage(file, maxSize = 1280) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

export async function savePhoto(file) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  let blob;
  try {
    blob = await resizeImage(file);
  } catch {
    blob = file; // 리사이즈 실패 시 원본 저장
  }
  await withStore('readwrite', (store) => store.put(blob, id));
  return id;
}

// 백업 복원용: 지정한 id로 blob을 그대로 저장
export async function putPhotoBlob(id, blob) {
  return withStore('readwrite', (store) => store.put(blob, id));
}

export async function getPhotoBlob(id) {
  return withStore('readonly', (store) => store.get(id));
}

export async function deletePhoto(id) {
  return withStore('readwrite', (store) => store.delete(id));
}

export async function clearPhotos() {
  return withStore('readwrite', (store) => store.clear());
}
