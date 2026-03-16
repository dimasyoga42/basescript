import { getUserData, saveUserData } from "../../src/config/func.js";
import { sendFancyText } from "../../src/config/message.js";
import path from "path";
const db = path.resolve("db", "afk.json");
export const checkUnAfk = async (conn, mchat, m) => {
  try {
    const data = getUserData(db);
    const userId = m.key.participant || m.key.remoteJid;
    const afkIndex = data.findIndex((i) => i.userId === userId);
    if (afkIndex === -1) return;
    const afkUser = data[afkIndex];
    data.splice(afkIndex, 1);
    saveUserData(db, data);

    const afkTime = Date.now() - afkUser.time;
    const minutes = Math.floor(afkTime / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeText;
    if (days > 0) timeText = `${days} hari`;
    else if (hours > 0) timeText = `${hours} jam`;
    else if (minutes > 0) timeText = `${minutes} menit`;
    else timeText = "beberapa detik";

    sendFancyText(conn, mchat, {
      title: "Neura Afk",
      body: "Neura Sama",
      text: `selamat datang kembali anda sudah afk selama ${timeText}`,
      thumbnail:
        "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
      quoted: m,
    });
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

export const checkMentionAfk = async (sock, chatId, msg) => {
  try {
    // Pastikan pesan memiliki mention
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    if (!contextInfo?.mentionedJid) return;

    const data = getUserData(db);
    const mentioned = contextInfo.mentionedJid;

    for (const userId of mentioned) {
      const afkUser = data.find((u) => u.userId === userId);
      if (afkUser) {
        const afkTime = Date.now() - afkUser.time;
        const minutes = Math.floor(afkTime / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeText;
        if (days > 0) timeText = `${days} hari lalu`;
        else if (hours > 0) timeText = `${hours} jam lalu`;
        else if (minutes > 0) timeText = `${minutes} menit lalu`;
        else timeText = "baru saja";

        const caption = `*User ini sedang AFK*\nSejak: ${timeText}\nCatatan: ${afkUser.note}`;
        sendFancyText(conn, mchat, {
          title: "Neura Afk",
          body: "Neura Sama",
          text: caption,
          thumbnail:
            "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
          quoted: m,
        });
      }
    }
  } catch (err) {
    console.error("Error di checkMentionAfk:", err);
  }
};
