import { getUserData, saveUserData } from "../../src/config/func.js";

export default class MemoryEngine {
  constructor(dbPath) {
    this.dbPath = dbPath;
  }

  _load() {
    const data = getUserData(this.dbPath);
    return Array.isArray(data) ? data : [];
  }

  get(userId) {
    const data = this._load();
    return data.find((v) => v?.id === userId) || {};
  }

  save(userId, patch) {
    const data = this._load();
    let entry = data.find((v) => v?.id === userId);
    if (!entry) {
      entry = { id: userId };
      data.push(entry);
    }

    for (const [key, value] of Object.entries(patch)) {
      if (key === "facts" && value && typeof value === "object") {
        // merge, jangan timpa fakta lama
        entry.facts = { ...(entry.facts || {}), ...value };
      } else {
        entry[key] = value;
      }
    }

    saveUserData(this.dbPath, data);
    return entry;
  }
}
