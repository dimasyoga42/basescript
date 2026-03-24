import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

export const isAdmin = async (conn, m) => {
  try {
    if (!m.chat.endsWith("@g.us")) {
      await conn.sendMessage(m.chat, { text: "khusus grup" }, { quoted: m });
      return false;
    }
    const metadata = await conn.groupMetadata(m.chat);
    const admin = metadata.participants.filter((p) => p.admin).map((p) => p.id);
    const senderId = m.key.participant || m.key.remoteJid;

    if (!admin.includes(senderId)) {
      sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        text: `*${config.message.notAdmin}*`,
        thumbnail: "",
        msg: m,
      });
      return false;
    }
    return true;
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      text: `*${config.message.error}*`,
      thumbnail: "",
      msg: m,
    });
    return false;
  }
};
const BOT_ID = config.admin;
export const isBotadmin = async (conn, m) => {
  try {
    if (!m.chat.endsWith("@g.us")) {
      await conn.sendMessage(m.chat, { text: "khusus grup" }, { quoted: m });
      return false;
    }
    const metadata = await conn.groupMetadata(m.chat);
    const admin = metadata.participants.filter((p) => p.admin).map((p) => p.id);

    if (!admin.includes(BOT_ID)) {
      sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        text: `*${config.message.botNotadmin}*`,
        thumbnail: thumbnail,
        quoted: m,
      });
      return false;
    }
    return true;
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      text: `*${config.message.error}*`,
      thumbnail: thumbnail,
      renderLargerThumbnail: true,
      quoted: m,
    });
    return false;
  }
};

export const botIsadmin = (conn, m) => {
  try {
  } catch (err) {}
};
