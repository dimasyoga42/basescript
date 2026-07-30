import fs from "fs";
import path from "path";

const ensureDir = (dbPath) => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

function getUserData(dbPath) {
  try {
    ensureDir(dbPath);

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "[]");
      return [];
    }

    const raw = fs.readFileSync(dbPath, "utf-8");

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (err) {
    console.error("Gagal membaca file:", err);
    return [];
  }
}

const saveUserData = (dbPath, data) => {
  try {
    ensureDir(dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${dbPath}:`, err);
  }
};


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
        entry.facts = { ...(entry.facts || {}), ...value };
      } else {
        entry[key] = value;
      }
    }

    saveUserData(this.dbPath, data);
    return entry;
  }
}
