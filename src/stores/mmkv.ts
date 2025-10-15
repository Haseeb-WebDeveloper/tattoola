let mmkv: { getString: (k: string) => string | undefined; set: (k: string, v: string) => void };

try {
  const { MMKV } = require("react-native-mmkv");
  mmkv = new MMKV();
} catch (e) {
  // Fallback to in-memory store when MMKV (TurboModules) is unavailable
  const mem = new Map<string, string>();
  mmkv = {
    getString: (k: string) => mem.get(k),
    set: (k: string, v: string) => {
      try { mem.set(k, v); } catch {}
    },
  } as any;
}

export { mmkv };

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = mmkv.getString(key);
    if (!v) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: any) {
  try {
    (mmkv as any).set(key, JSON.stringify(value));
  } catch {}
}


