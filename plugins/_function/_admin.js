import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

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
      sendText(conn, m.chat, "anda bukan andmin");
      return false;
    }
    return true;
  } catch (err) {
    sendText(conn, m.chat, "terjadi kesalahan coba lagi");
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
      sendText(conn, m.chat, "bot bukan admin");
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
