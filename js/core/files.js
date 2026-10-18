// files.js
// Keeps uploaded CV files in the browser's IndexedDB (too big for localStorage).
// One CV per account, stored under the account's email.

let dbPromise = null;
const memoryCopy = {}; // fallback when IndexedDB is not available

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('jobauto-files', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('cv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
  return dbPromise;
}

export function putCv(email, file) {
  memoryCopy[email] = file;
  return openDb()
    .then(
      (db) =>
        new Promise((resolve) => {
          const tx = db.transaction('cv', 'readwrite');
          tx.objectStore('cv').put(file, email);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        }),
    )
    .catch(() => {});
}

export function getCv(email) {
  if (memoryCopy[email]) return Promise.resolve(memoryCopy[email]);
  return openDb()
    .then(
      (db) =>
        new Promise((resolve) => {
          const req = db.transaction('cv').objectStore('cv').get(email);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        }),
    )
    .catch(() => null);
}

export function deleteCv(email) {
  delete memoryCopy[email];
  return openDb()
    .then((db) => db.transaction('cv', 'readwrite').objectStore('cv').delete(email))
    .catch(() => {});
}
