import { downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

const PACK_NAME = config.BotName;
const AUTHOR_NAME = config.OwnerName;

const getMediaMessage = (m) => {
  if (m.message?.imageMessage || m.message?.videoMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage || quoted?.videoMessage) return { message: quoted };
  return null;
};

const parseText = (text = "") => {
  const input = text.replace(/\.(stiker|s|smeme)/i, "").trim();
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
        thumbnail,
        text: "Reply gambar/video dengan .stiker\nContoh: .stiker Halo | Dunia",
        msg: m,
      });

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage },
    );

    if (mediaMsg.message?.videoMessage) {
      const sticker = await new Sticker(buffer, {
        pack: PACK_NAME,
        author: AUTHOR_NAME,
        type: StickerTypes.FULL,
        quality: 50,
        animated: true,
      }).toBuffer();
      return await conn.sendMessage(m.chat, { sticker }, { quoted: m });
    }

    const { top, bottom } = parseText(m.text);

    const form = new FormData();
    form.append("image", buffer.toString("base64"));

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() },
    );

    const imageUrl = upload.data.data.url;
    const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(imageUrl)}`;

    const memeRes = await axios.get(memeUrl, { responseType: "arraybuffer" });

    const sticker = await new Sticker(Buffer.from(memeRes.data), {
      pack: config.BotName,
      author: config.OwnerName,
      type: StickerTypes.FULL,
      quality: 80,
    }).toBuffer();

    await conn.sendMessage(m.chat, { sticker }, { quoted: m });
  } catch (err) {
    console.error("[stiker]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = "stiker";
handler.alias = ["s", "smeme"];
handler.category = "Menu Tools";
handler.submenu = "Media";
export default handler;
