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

export const checkUnAfk = async (conn, mchat, m) => {
  try {
    const data = getUserData(db);
    const userId = m.key.participant || m.key.remoteJid;
    const groupId = m.chat;

    if (!data[groupId]) return;

    const afkIndex = data[groupId].afk.findIndex((u) => u.userId === userId);
    if (afkIndex === -1) return;

    const afkUser = data[groupId].afk[afkIndex];
    data[groupId].afk.splice(afkIndex, 1);

    // Hapus key grup jika afk sudah kosong
    if (data[groupId].afk.length === 0) delete data[groupId];

    saveUserData(db, data);

    const timeText = formatTime(Date.now() - afkUser.time);
    sendText(
      conn,
      m.chat,
      `selamat datang kembali, anda afk selama ${timeText}`,
      m,
    );
  } catch (err) {
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
    if (!contextInfo?.mentionedJid) return;

    const data = getUserData(db);
    const groupId = chatId;

    if (!data[groupId]) return;

    // Cek mute grup — skip semua jika mute aktif
    if (data[groupId].mute) return;

    const mentioned = contextInfo.mentionedJid;

    for (const userId of mentioned) {
      const afkUser = data[groupId].afk.find((u) => u.userId === userId);
      if (!afkUser) continue;

      const timeText = formatTime(Date.now() - afkUser.time, " lalu");
      const caption = `user ini sedang AFK\nSejak: ${timeText}\nCatatan: ${afkUser.note}`;

      sendFancyText(conn, chatId, {
        title: "Neura Afk",
        body: "Neura Sama",
        text: caption,
        thumbnail:
          "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
        quoted: m,
      });
    }
  } catch (err) {
    console.error("Error di checkMentionAfk:", err);
  }
};
