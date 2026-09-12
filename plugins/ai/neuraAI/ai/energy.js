import JsonStore from "./store.js";

/**
 * [OPTIMASI] MemoryEngine sekarang cuma wrapper tipis di atas JsonStore.
 * get()  -> baca dari cache in-memory (bukan fs.readFileSync tiap panggil).
 * save() -> upsert ke cache + jadwalkan 1 disk write yang di-debounce,
 *           bukan langsung readFileSync+writeFileSync sinkron.
 * `facts` di-merge (bukan ditimpa) via mergeKeys, sama seperti perilaku lama.
 */
export default class MemoryEngine {
  constructor(dbPath) {
    this.store = new JsonStore(dbPath);
  }

  get(userId) {
    return this.store.get(userId) || {};
  }

  save(userId, patch) {
    return this.store.upsert(userId, patch, { mergeKeys: ["facts"] });
  }

  /** Paksa tulis perubahan pending ke disk sekarang (mis. saat shutdown). */
  flush() {
    this.store.flushSync();
  }
}
