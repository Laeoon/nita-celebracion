/**
 * Almacenamiento persistente de pistas de audio en IndexedDB.
 * Permite que las canciones MP3 subidas por los usuarios sigan funcionando
 * incluso después de recargar la página o cerrar el navegador (evita que mueran los Blob URLs).
 */

const DB_NAME = 'nita_audio_db';
const STORE_NAME = 'tracks_blob_store';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function guardarAudioEnIndexedDB(id: string, file: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id, blob: file });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB no disponible, usando memoria de sesión', err);
  }
}

export async function obtenerAudioDeIndexedDB(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result ? request.result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error leyendo de IndexedDB', err);
    return null;
  }
}

export async function eliminarAudioDeIndexedDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error eliminando de IndexedDB', err);
  }
}
