import fs from "fs";
import path from "path";

const ensureDir = (dbPath) => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

function readJsonArray(dbPath) {
  try {
    ensureDir(dbPath);

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "[]");
      return [];
    }

    const raw = fs.readFileSync(dbPath, "utf-8");
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`[Store] Gagal membaca ${dbPath}:`, err.message);
    return [];
  }
}

function writeJsonArray(dbPath, data) {
  try {
    ensureDir(dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[Store] Gagal menulis ${dbPath}:`, err.message);
  }
}

/**
 * JsonStore: pembungkus file JSON berbentuk array-of-object berkunci `id`.
 *
 * Sebelumnya: setiap `get()`/`save()` di MemoryEngine & PersonalityEvolutionEngine
 * langsung readFileSync + writeFileSync ke disk. Dalam SATU pesan masuk, itu
 * bisa terjadi 3-5 kali (evolution update, memory get, memory save mood/rel,
 * saveFacts) -> semuanya sinkron & blocking event loop.
 *
 * Sekarang: file dibaca sekali lalu di-cache di memori selama proses hidup.
 * Semua `upsert()` cuma mengubah cache + menjadwalkan SATU disk write yang
 * di-debounce (default 300ms) supaya beberapa upsert berdekatan (mis. mood
 * lalu facts pada pesan yang sama) digabung jadi satu kali penulisan file.
 */
export default class JsonStore {
  constructor(dbPath, { flushDelayMs = 300 } = {}) {
    this.dbPath = dbPath;
    this.flushDelayMs = flushDelayMs;
    this._data = null;
    this._flushTimer = null;
    this._dirty = false;

    // Jaring pengaman: kalau proses exit sebelum debounce sempat jalan,
    // paksa tulis sisa perubahan supaya tidak hilang.
    process.on("exit", () => this.flushSync());
  }

  _ensureLoaded() {
    if (this._data === null) {
      this._data = readJsonArray(this.dbPath);
    }
    return this._data;
  }

  getAll() {
    return this._ensureLoaded();
  }

  get(id) {
    const data = this._ensureLoaded();
    return data.find((v) => v?.id === id) || null;
  }

  /**
   * Gabungkan `patch` ke entry `id` (dibuat baru kalau belum ada).
   * `mergeKeys`: daftar key yang harus di-spread-merge (bukan ditimpa),
   * mis. `facts` supaya fakta lama tidak hilang.
   */
  upsert(id, patch, { mergeKeys = [] } = {}) {
    const data = this._ensureLoaded();
    let entry = data.find((v) => v?.id === id);

    if (!entry) {
      entry = { id };
      data.push(entry);
    }

    for (const [key, value] of Object.entries(patch)) {
      if (mergeKeys.includes(key) && value && typeof value === "object" && !Array.isArray(value)) {
        entry[key] = { ...(entry[key] || {}), ...value };
      } else {
        entry[key] = value;
      }
    }

    this._dirty = true;
    this._scheduleFlush();
    return entry;
  }

  _scheduleFlush() {
    if (this._flushTimer) return;
    this._flushTimer = setTimeout(() => {
      this._flushTimer = null;
      this.flushSync();
    }, this.flushDelayMs);
    this._flushTimer.unref?.();
  }

  /** Tulis ke disk sekarang juga kalau ada perubahan pending. */
  flushSync() {
    if (!this._dirty || this._data === null) return;
    writeJsonArray(this.dbPath, this._data);
    this._dirty = false;
  }
}
