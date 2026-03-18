import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "vip.json");

export const checkVip = async (chatId) => {
  const data = await getUserData(db);
  const user = data.find((e) => e.grubID === chatId);
  if (!user) return false;

  if (new Date(user.expired) < new Date()) {
    saveUserData(
      db,
      data.filter((e) => e.grubID !== chatId),
    );
    return false;
  }
  return true;
};

export const cleanExpiredVip = async () => {
  const data = await getUserData(db);
  const filtered = data.filter((e) => new Date(e.expired) > new Date());
  if (filtered.length !== data.length) {
    saveUserData(db, filtered);
    console.log(
      `[VIP] ${data.length - filtered.length} expired entries removed`,
    );
  }
};
