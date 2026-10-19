
export const TEXT_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  text: string;
  at: number;
}

const inflight = new Map<string, Promise<string>>();
const cache = new Map<string, CacheEntry>();

export function fetchTextOnce(url: string): Promise<string> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TEXT_CACHE_TTL_MS) {
    return Promise.resolve(hit.text);
  }
  const running = inflight.get(url);
  if (running) return running;

  const task = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      cache.set(url, { text, at: Date.now() });
      return text;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, task);
  return task;
}
