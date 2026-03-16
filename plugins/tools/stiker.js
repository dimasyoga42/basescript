import { downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";
import sharp from "sharp";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

const STICKER_SIZE = 512;
const WEBP_QUALITY = 80;
const PACK_NAME = config.BotName;
const AUTHOR_NAME = config.OwnerName;

const getMediaMessage = (msg) => {
  if (msg.message?.imageMessage || msg.message?.videoMessage) return msg;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage || quoted?.videoMessage) return { message: quoted };
  return null;
};

const parseText = (text = "") => {
  const input = text.replace(/\.(stiker|sticker)/i, "").trim();
  const [top = "_", bottom = "_"] = input.split("|");
  return {
    top: encodeURIComponent(top.trim() || "_"),
    bottom: encodeURIComponent(bottom.trim() || "_"),
  };
};

const handler = async (m, { conn }) => {
  try {
    const mediaMsg = getMediaMessage(m);
    if (!mediaMsg)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: "Reply gambar/video dengan .stiker\nContoh: .stiker Halo | Dunia",
        msg: m,
      });

    const { top, bottom } = parseText(m.text);

    /* VIDEO → STICKER */
    if (mediaMsg.message?.videoMessage) {
      const vid = await downloadMediaMessage(
        mediaMsg,
        "buffer",
        {},
        { reuploadRequest: conn.updateMediaMessage },
      );
      const sticker = await new Sticker(vid, {
        pack: PACK_NAME,
        author: AUTHOR_NAME,
        type: StickerTypes.FULL,
        quality: 50,
        animated: true,
      }).toBuffer();
      await conn.sendMessage(m.chat, { sticker }, { quoted: m });
      return;
    }

    /* IMAGE → MEME STICKER */
    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage },
    );

    const form = new FormData();
    form.append("image", buffer.toString("base64"));
    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() },
    );
    const imageUrl = upload.data.data.url;

    const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(imageUrl)}`;
    const memeImage = await axios.get(memeUrl, { responseType: "arraybuffer" });

    const stickerBuffer = await sharp(memeImage.data)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
  } catch (err) {
    console.error("[stiker] Error:", err.message);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["stiker", "sticker"];
handler.category = "Tools";
handler.submenu = "Media";
export default handler;
