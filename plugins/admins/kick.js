import { sendFancyText, sendText } from "../../src/config/message.js";
import { isAdmin, isBotadmin } from "../_function/_admin.js";

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    if (!(await isBotadmin(conn, m))) return;
    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mention.length)
      return sendText(conn, m.chat, "tag user yang akan di kick");
    await conn.groupParticipantsUpdate(m.chat, mention, "remove");
    sendText(conn, m.chat, "Target Berhasil di Kick", m);
  } catch (err) {
    sendText(conn, m.chat, "terjadi kesalahan server saat mencoba kick");
  }
};
handler.command = ["kick"];
handler.category = "Menu Admin";
handler.submenu = "admin";
export default handler;
