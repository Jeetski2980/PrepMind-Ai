const DATABASE_NAME = "prepmind-local-study-data";
const DATABASE_VERSION = 1;
const STORE_NAME = "records";

let databasePromise = null;
let hasWarnedAboutPersistence = false;

function warnAboutPersistence(error) {
  if (hasWarnedAboutPersistence) return;
  hasWarnedAboutPersistence = true;
  console.warn(
    "PrepMind could not access local study storage. The app will continue without saving this data.",
    error?.name || error
  );
}

function openDatabase() {
  if (typeof globalThis.indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    let request;
    try {
      request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => reject(request.error || new Error("Could not open local study storage."));
    request.onblocked = () => reject(new Error("Local study storage is blocked by another tab."));
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

export async function readLocalRecord(key) {
  try {
    const database = await openDatabase();
    return await new Promise((resolve, reject) => {
      let value = null;
      let transaction;
      try {
        transaction = database.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => {
          value = request.result?.value ?? null;
        };
        request.onerror = () => reject(request.error || new Error("Could not read local study data."));
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(value);
      transaction.onerror = () => reject(transaction.error || new Error("Could not read local study data."));
      transaction.onabort = () => reject(transaction.error || new Error("Local study data read was interrupted."));
    });
  } catch (error) {
    warnAboutPersistence(error);
    return null;
  }
}

export async function writeLocalRecord(key, value) {
  try {
    const database = await openDatabase();
    await new Promise((resolve, reject) => {
      let transaction;
      try {
        transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put({ key, value, updatedAt: Date.now() });
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not save local study data."));
      transaction.onabort = () => reject(transaction.error || new Error("Local study data save was interrupted."));
    });
    return true;
  } catch (error) {
    warnAboutPersistence(error);
    return false;
  }
}

export async function deleteLocalRecord(key) {
  try {
    const database = await openDatabase();
    await new Promise((resolve, reject) => {
      let transaction;
      try {
        transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(key);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not clear local study data."));
      transaction.onabort = () => reject(transaction.error || new Error("Local study data clear was interrupted."));
    });
    return true;
  } catch (error) {
    warnAboutPersistence(error);
    return false;
  }
}
