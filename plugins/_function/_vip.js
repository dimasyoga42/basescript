import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "vip.json");

const parseExpired = (value) => {
  if (!value) return null;

  // kalau sudah number (timestamp)
  if (typeof value === "number") return value;

  // kalau string → convert ke timestamp
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.getTime();
};

export const checkVip = (chatId) => {
  const data = getUserData(db);
  if (!Array.isArray(data)) return false;

  const now = Date.now();

  const index = data.findIndex((e) => e.grubID === chatId);
  if (index === -1) return false;

  const user = data[index];
  const expired = parseExpired(user.expired);

  // invalid / expired → hapus
  if (!expired || expired <= now) {
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
    const expired = parseExpired(e.expired);
    return expired && expired > now;
  });

  if (filtered.length !== data.length) {
    saveUserData(db, filtered);
    console.log(
      `[VIP] ${data.length - filtered.length} expired entries removed`
    );
  }
};

export const setVip = (chatId, days) => {
  const data = getUserData(db) || [];
  const now = Date.now();

  const duration = days * 24 * 60 * 60 * 1000;
  const newExpired = now + duration;

  const existing = data.find((e) => e.grubID === chatId);

  if (existing) {
    const current = parseExpired(existing.expired) || now;
    existing.expired = current > now ? current + duration : newExpired;
  } else {
    data.push({
      grubID: chatId,
      expired: newExpired,
    });
  }

  saveUserData(db, data);

  return newExpired;
};

export const getVipInfo = (chatId) => {
  const data = getUserData(db);
  if (!Array.isArray(data)) return null;

  const user = data.find((e) => e.grubID === chatId);
  if (!user) return null;

  const expired = parseExpired(user.expired);
  if (!expired) return null;

  return {
    expired,
    remaining: expired - Date.now(),
  };
};
