import { sendFancyText, sendText } from "../../src/config/message.js";
import { isAdmin, isBotadmin } from "../_function/_admin.js";

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    if (!(await isBotadmin(conn, m))) return;
    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mention.length)
      return sendFancyText(conn, m.chat, {
        title: "Neura Sama",
        body: "waah gagal nih",
        text: "tag user yang akan di kick .kick @user",
        thumbnail:
          "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
        quoted: m,
      });
    await conn.groupParticipantsUpdate(m.chat, mention, "remove");
    sendText(conn, m.chat, "Target Berhasil di Kick", m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: "Neura Sama",
      body: "waah gagal nih",
      text: "coba cek lagi command nya",
      thumbnail:
        "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
      quoted: m,
    });
  }
};
handler.command = ["kick"];
handler.category = "Menu Admin";
handler.submenu = "admin";
export default handler;
