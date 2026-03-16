import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";
const db = path.resolve("db", "mute.json");

export const isMuted = (m) => {
  const sender = m.key?.participant || m.key?.remoteJid;
  if (!sender) return false;

  const data = getUserData(db);
  const user = data.find((u) => u.id === sender);
  if (!user) return false;

  const now = new Date();
  const expired = new Date(user.expired);
  if (expired < now) {
    saveUserData(
      db,
      data.filter((u) => u.id !== sender),
    );
    return false;
  }
  return true;
};
