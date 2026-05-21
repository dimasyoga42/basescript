import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "mute.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];

    if (mention.length === 0)
      return sendText(conn, m.chat, "format sala gunakan .umute @tag", m);

    const target = mention[0];
    const data = getUserData(db);
    saveUserData(
      db,
      data.filter((u) => u.id !== target),
    );

    sendText(conn, m.chat, "user telah di unmute", m);
  } catch (err) {
    sendText(conn, m.chat, "terjadi kesalahan pada server", m);
  }
};

handler.command = ["unmute"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
