import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";

const MEDIA_TYPES = [
  { key: "imageMessage", type: "image" },
  { key: "videoMessage", type: "video" },
  { key: "documentMessage", type: "document" },
  { key: "audioMessage", type: "audio" },
  { key: "stickerMessage", type: "sticker" },
];

const handleQuoted = async (conn, m, quotedMsg, mentions) => {
  // Text
  if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
    return conn.sendMessage(
      m.chat,
      {
        text: quotedMsg.conversation || quotedMsg.extendedTextMessage.text,
        mentions,
      },
      { quoted: m },
    );
  }

  // Media
  for (const { key, type } of MEDIA_TYPES) {
    if (!quotedMsg[key]) continue;
    try {
      const buffer = await downloadMediaMessage(
        { key: m.key, message: { [key]: quotedMsg[key] } },
        "buffer",
        {},
        { reuploadRequest: conn.updateMediaMessage },
      );
      return conn.sendMessage(
        m.chat,
        {
          [type]: buffer,
          caption: quotedMsg[key].caption || "",
          mentions,
          mimetype: quotedMsg[key].mimetype,
        },
        { quoted: m },
      );
    } catch {
      if (quotedMsg[key].caption)
        return conn.sendMessage(
          m.chat,
          { text: quotedMsg[key].caption, mentions },
          { quoted: m },
        );
    }
  }

  // Fallback
  await conn.sendMessage(m.chat, { text: "", mentions }, { quoted: m });
};

const handler = async (m, { conn }) => {
  try {
    if (!m.chat.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group only", m);

    const arg = m.text.replace(/^\.hidetag\s*/i, "").trim();
    const meta = await conn.groupMetadata(m.chat);

    if (!meta?.participants?.length)
      return sendText(conn, m.chat, "Failed to get group info", m);

    const mentions = meta.participants
      .filter((p) => p.id !== conn.user?.id)
      .map((p) => p.id);

    if (!mentions.length) return sendText(conn, m.chat, "No members to tag", m);

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted) return handleQuoted(conn, m, quoted, mentions);

    if (arg)
      await conn.sendMessage(m.chat, { text: arg, mentions }, { quoted: m });
  } catch (err) {
    console.error("[hidetag]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["hidetag", "h"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
