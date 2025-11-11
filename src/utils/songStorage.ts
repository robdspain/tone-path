// Song storage types and IndexedDB utilities
import type { TranscriptionData } from '@/types/transcription';

export interface SavedSong {
  id: string;
  name: string;
  instrument: string;
  transcriptionData: TranscriptionData;
  createdAt: number;
  updatedAt: number;
  duration?: number;
  noteCount?: number;
  chordCount?: number;
  tags?: string[];
}

const DB_NAME = 'MusicPracticeApp';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('instrument', 'instrument', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const saveSong = async (song: SavedSong): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(song);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save song'));
  });
};

export const getAllSongs = async (): Promise<SavedSong[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const songs = request.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(songs);
    };
    request.onerror = () => reject(new Error('Failed to load songs'));
  });
};

export const getSong = async (id: string): Promise<SavedSong | null> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to load song'));
  });
};

export const deleteSong = async (id: string): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete song'));
  });
};

export const searchSongs = async (query: string): Promise<SavedSong[]> => {
  const allSongs = await getAllSongs();
  const lowerQuery = query.toLowerCase();
  
  return allSongs.filter((song) => {
    return (
      song.name.toLowerCase().includes(lowerQuery) ||
      song.instrument.toLowerCase().includes(lowerQuery) ||
      (song.tags && song.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
    );
  });
};

export const getSongsByInstrument = async (instrument: string): Promise<SavedSong[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('instrument');
    const request = index.getAll(instrument);

    request.onsuccess = () => {
      const songs = request.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(songs);
    };
    request.onerror = () => reject(new Error('Failed to load songs'));
  });
};

