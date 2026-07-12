import { getUserData, saveUserData } from "../../src/config/func.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import path from "path";

const db = path.resolve("db", "afk.json");

const formatTime = (ms, suffix = "") => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} hari${suffix}`;
  if (hours > 0) return `${hours} jam${suffix}`;
  if (minutes > 0) return `${minutes} menit${suffix}`;
  return suffix ? "baru saja" : "beberapa detik";
};

// samakan format JID (buang suffix device ":xx")
const normalizeJid = (jid = "") => jid.split(":")[0] + "@" + jid.split("@")[1];

export const checkUnAfk = async (conn, mchat, m) => {
  try {
    const data = getUserData(db);
    const userId = normalizeJid(m.key.participant || m.key.remoteJid);
    const groupId = m.chat;

    if (!data[groupId] || !Array.isArray(data[groupId].afk)) return;

    const afkIndex = data[groupId].afk.findIndex(
      (u) => normalizeJid(u.userId) === userId,
    );
    if (afkIndex === -1) return;

    const afkUser = data[groupId].afk[afkIndex];
    data[groupId].afk.splice(afkIndex, 1);
    // Grup tidak dihapus meskipun afk kosong
    saveUserData(db, data);

    const timeText = formatTime(Date.now() - afkUser.time);
    sendText(
      conn,
      m.chat,
      `selamat datang kembali, anda afk selama ${timeText}`,
      m,
    );
  } catch (err) {
    console.error("Error di checkUnAfk:", err);
    sendFancyText(conn, mchat, {
      title: "Neura Sama",
      body: "waah gagal nih",
      text: "coba di ulang lagi",
      thumbnail:
        "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
      quoted: m,
    });
  }
};

export const checkMentionAfk = async (conn, chatId, m) => {
  try {
    const contextInfo = m.message?.extendedTextMessage?.contextInfo;
    if (!contextInfo?.mentionedJid?.length) return;

    const data = getUserData(db);
    const groupId = chatId;

    if (!data[groupId] || !Array.isArray(data[groupId].afk)) return;
    // if (data[groupId].mute) return;

    const mentioned = contextInfo.mentionedJid.map(normalizeJid);

    for (const userId of mentioned) {
      const afkUser = data[groupId].afk.find(
        (u) => normalizeJid(u.userId) === userId,
      );
      if (!afkUser) continue;

      const timeText = formatTime(Date.now() - afkUser.time, " lalu");
      const caption = `user ini sedang AFK\nSejak: ${timeText}\nCatatan: ${afkUser.note || "tidak ada"}`;

      await sendText(conn, chatId, caption, m);
    }
  } catch (err) {
    console.error("Error di checkMentionAfk:", err);
  }
};
