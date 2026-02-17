
export const Cache = {
  set: <T>(key: string, data: T): void => {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.warn(`Storage quota exceeded for ${key}. Attempting to cleanup...`, error);
      // Simple strategy: If quota exceeded, maybe we don't save this update, 
      // or we could implement an LRU strategy in the future.
      // For now, alerting the user via console is enough for debugging.
    }
  },
  
  get: <T>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return fallback;
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Error loading cache for ${key}`, error);
      return fallback;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
  }
};
