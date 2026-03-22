import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const getSticker = (m) => {
  if (m.message?.stickerMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quoted?.stickerMessage ? { message: quoted } : null;
};

const handler = async (m, { conn }) => {
  try {
    const stickerMsg = getSticker(m);

    if (!stickerMsg)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: "Kirim/reply stiker dengan .toimg",
        msg: m,
      });

    const buffer = await downloadMediaMessage(
      stickerMsg,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage },
    );

    await conn.sendMessage(
      m.chat,
      { image: buffer, caption: "✅ Stiker → Gambar" },
      { quoted: m },
    );
  } catch (err) {
    console.error("[toimg]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["toimg", "simg", "stotoimg"];
handler.category = "Menu Tools";
handler.submenu = "Media";
export default handler;
