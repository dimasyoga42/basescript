import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "vip.json");

const parseDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const checkVip = (chatId) => {
  const data = getUserData(db);
  if (!Array.isArray(data)) return false;

  const now = Date.now();

  const index = data.findIndex((e) => e.grubID === chatId);
  if (index === -1) return false;

  const user = data[index];
  const expiredDate = parseDate(user.expired);

  // jika tanggal invalid, anggap expired & bersihkan
  if (!expiredDate || expiredDate.getTime() <= now) {
    data.splice(index, 1);
    saveUserData(db, data);
    return false;
  }

  return true;
};

export const cleanExpiredVip = () => {
  const data = getUserData(db);
  if (!Array.isArray(data) || data.length === 0) return;

  const now = Date.now();

  const filtered = data.filter((e) => {
    const d = parseDate(e.expired);
    return d && d.getTime() > now;
  });

  if (filtered.length !== data.length) {
    saveUserData(db, filtered);
    console.log(
      `[VIP] ${data.length - filtered.length} expired entries removed`
    );
  }
};
