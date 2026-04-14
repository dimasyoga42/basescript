import fs from "fs";
import path from "path";

const ensureDir = (dbPath) => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export function getUserData(dbPath) {
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

export const saveUserData = (dbPath, data) => {
  try {
    ensureDir(dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${dbPath}:`, err);
  }
};
