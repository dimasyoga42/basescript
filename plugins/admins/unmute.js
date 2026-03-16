import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "mute.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];

    if (mention.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: "Format: .unmute @user",
        msg: m,
      });

    const target = mention[0];
    const data = getUserData(db);
    saveUserData(
      db,
      data.filter((u) => u.id !== target),
    );

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.unmute,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["unmute"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
