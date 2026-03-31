import { getUserData, saveUserData } from "../../src/config/func.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import path from "path";

const db = path.resolve("db", "afk.json");

const handler = (m, { conn }) => {
  try {
    const pesan = m.text.replace(".afk", "").trim();
    if (!pesan)
      return sendFancyText(conn, m.chat, {
        title: "Neura Sama",
        body: "waah gagal nih",
        text: "coba di ulang lagi dengan format .afk pesan anda",
        thumbnail:
          "https://i.pinimg.com/736x/16/46/ee/1646eef2bf7003c46eb1c0ac6aa6e16e.jpg",
        msg: m,
      });

    const data = getUserData(db);
    const userId = m.key.participant || m.key.remoteJid;
    const groupId = m.chat;

    // Inisialisasi grup jika belum ada
    if (!data[groupId]) data[groupId] = { mute: false, afk: [] };

    const alreadyAfk = data[groupId].afk.find((u) => u.userId === userId);
    if (alreadyAfk)
      return sendText(conn, m.chat, `anda sudah dalam mode afk`, m);

    data[groupId].afk.push({
      userId,
      note: pesan,
      time: Date.now(),
    });

    saveUserData(db, data);
    sendText(conn, m.chat, `anda memasuki mode afk dengan alasan: ${pesan}`, m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: "Neura Sama",
      body: "waah gagal nih",
      text: "coba di ulang lagi",
      thumbnail:
        "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
      msg: m,
    });
  }
};

handler.command = ["afk"];
handler.category = "Menu Sosial";
handler.submenu = "Sosial";
export default handler;
