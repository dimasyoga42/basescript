import { generateWAMessageFromContent, proto } from "@whiskeysockets/baileys";
import axios from "axios";
import { config, thumbnail } from "../../config.js";

const getThumbnailBuffer = async () => {
  try {
    if (!thumbnail) return null;
    const res = await axios.get(thumbnail, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
};

const handler = async (m, { conn }) => {
  try {
    const thumbBuffer = await getThumbnailBuffer();

    const msg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: {
                text: `Hai *${m.pushName || "User"}* 👋\nPilih menu di bawah ini:`,
              },
              footer: { text: `${config.BotName} • ${config.Version}` },
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 777,
                isForwarded: true,
                externalAdReply: {
                  title: config.BotName,
                  body: `Developer: ${config.OwnerName}`,
                  mediaType: 1,
                  thumbnail: thumbBuffer,
                  renderLargerThumbnail: true,
                },
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🏠 Menu",
                      id: `${config.prefix}menu`,
                    }),
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🏓 Ping",
                      id: `${config.prefix}ping`,
                    }),
                  },
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "ℹ️ Info",
                      id: `${config.prefix}info`,
                    }),
                  },
                ],
              },
            },
          },
        },
      }),
      { quoted: m, userJid: conn.user?.id },
    );

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch (err) {
    console.error("[menu]", err.message);
    await conn.sendMessage(
      m.chat,
      {
        text: `*${config.BotName}*\n\n• ${config.prefix}ping\n• ${config.prefix}menu\n• ${config.prefix}info`,
      },
      { quoted: m },
    );
  }
};

handler.command = ["menutes"];
handler.category = "main";
handler.submenu = "Main";
export default handler;
