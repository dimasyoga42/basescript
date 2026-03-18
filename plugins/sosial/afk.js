import { getUserData, saveUserData } from "../../src/config/func.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import path from "path";

const db = path.resolve("db", "afk.json");
const handler = (m, { conn }) => {
  try {
    const pesan = m.text.replace(".afk", "");
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
    let afkEntry = data.find((user) => user.userId === userId);
    if (!afkEntry) {
      const newAfk = {
        userId,
        note: pesan,
        time: Date.now(),
      };
      data.push(newAfk);
      saveUserData(db, data);
      // sendFancyText(conn, m.chat, {
      //   title: "Neura Afk",
      //   body: "selalu hadir di sisi mu",
      //   text: `anda memasuki mode afk\nPesan: ${pesan}`,
      //   thumbnail:
      //     "https://i.pinimg.com/736x/16/46/ee/1646eef2bf7003c46eb1c0ac6aa6e16e.jpg",
      //   msg: m,
      // });
      sendText(
        conn,
        m.chat,
        `anda memasuki mode afk dengan alasan: ${pesan}`,
        m,
      );
    }
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
