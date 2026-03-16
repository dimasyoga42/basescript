import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "mute.json");

const getExp = (minute) => {
  const m = parseInt(minute);
  if (isNaN(m) || m <= 0) return null;
  const now = new Date();
  now.setMinutes(now.getMinutes() + m);
  return now.toISOString();
};

const handler = async (m, { conn, text }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    // text = "30 @user" (command sudah di-strip)
    const minute = text.trim().split(/\s+/)[0];
    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];

    if (mention.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `exemple: .mute time @user`,
        thumbnail,
        text: config.message.invalid,
        quoted: m,
      });

    const expDate = getExp(minute);
    if (!expDate)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `exemple: .mute time @user`,
        thumbnail,
        text: config.message.invalid,
        quoted: m,
      });

    const target = mention[0];
    const data = getUserData(db);
    let user = data.find((u) => u.id === target);
    if (!user) {
      data.push({ id: target, expired: expDate });
    } else {
      user.expired = expDate;
    }
    saveUserData(db, data);

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.mute,
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

handler.command = ["mute"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
