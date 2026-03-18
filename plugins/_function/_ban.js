import path from "path";
import { config } from "../../config.js";
import { getUserData } from "../../src/config/func.js";

const db = path.resolve("db", "banned.json");

export const isBan = async (conn, m) => {
  try {
    const userId = m.key.participant || m.key.remoteJid;
    if (!userId) return false;

    const data = await getUserData(db);
    const banned = data.find((e) =>
      e.ban?.some((b) => b.userid === userId && b.value === true),
    );

    if (banned) {
      await conn.sendMessage(m.chat, { text: "You are banned" }, { quoted: m });
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const isOwner = (conn, m) => {
  const userId = m.key.participant || m.key.remoteJid;
  const owners = Array.isArray(config.owner) ? config.owner : [config.owner];

  if (!owners.includes(userId)) {
    conn.sendMessage(m.chat, { text: "Owner only" }, { quoted: m });
    return false;
  }
  return true;
};
