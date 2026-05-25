import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData } from "../../src/config/func.js";

const db = path.resolve("db", "warn.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const data = getUserData(db);
    const group = data.find((g) => g.id === m.chat);

    if (!group || !group.members.length)
      return sendText(conn, m.chat, "tidak ada user yang di warn", m);

    const mentions = group.members.map((u) => u.id);
    const list = group.members
      .map((u, i) => `${i + 1}. @${u.id.split("@")[0]} - *${u.warn}/4*`)
      .join("\n");

    await conn.sendMessage(
      m.chat,
      {
        text: `LIST WARN\n${list}`,
        mentions,
      },
      { quoted: m },
    );
  } catch (err) {
    sendText(conn, m.chat, "terjadi kesalahan pada server", m);
  }
};

handler.command = ["listwarn"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
