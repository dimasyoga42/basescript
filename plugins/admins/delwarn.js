import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "warn.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    if (mention.length === 0)
      return sendText(conn, m.chat, "format salah .delwarn @tag", m);

    const target = mention[0];
    const data = getUserData(db);
    const group = data.find((g) => g.id === m.chat);

    if (!group || !group.members.find((u) => u.id === target))
      return sendText(conn, m.chat, "user tidak ada dalam grub", m);

    group.members = group.members.filter((u) => u.id !== target);
    saveUserData(db, data);

    sendText(conn, m.chat, "warn user berhasil di hapus.", m);
  } catch (err) {
    sendText(conn, m.chat, "teradi kesalahan pada server", m);
  }
};

handler.command = ["delwarn"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
