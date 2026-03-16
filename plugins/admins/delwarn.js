import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "warn.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    if (mention.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .delwarn @user",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

    const target = mention[0];
    const data = getUserData(db);
    const group = data.find((g) => g.id === m.chat);

    if (!group || !group.members.find((u) => u.id === target))
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: "User tidak memiliki warn di grup ini.",
        msg: m,
      });

    group.members = group.members.filter((u) => u.id !== target);
    saveUserData(db, data);

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: "Warn user berhasil dihapus.",
      msg: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["delwarn"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
