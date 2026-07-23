import { downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { getUserData } from "../../src/config/func.js";
import path from "path";

const db = path.resolve("db", "packname.json");

const getMediaMessage = (m) => {
  if (m.message?.imageMessage || m.message?.videoMessage) return m;

  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted };
  }

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

const getStickerWM = (chatId) => {
  const data = getUserData(db);

  if (!Array.isArray(data)) {
    return {
      packname: config.BotName,
      author: config.OwnerName,
    };
  }

  const dataPack = data.find((item) => item.id === chatId);

  return {
    packname: dataPack?.pack || config.BotName,
    author: dataPack?.author || config.OwnerName,
  };
};

const handler = async (m, { conn }) => {
  try {
    const mediaMsg = getMediaMessage(m);

    if (!mediaMsg) {
      return sendText(conn, m.chat,  "Reply gambar/video dengan .stiker\nContoh: .stiker Halo | Dunia", m);
    }

    const { packname, author } = getStickerWM(m.chat);

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      {
        reuploadRequest: conn.updateMediaMessage,
      },
    );

    if (mediaMsg.message?.videoMessage) {
      return conn.sendSticker(m.chat, {
        sticker: buffer,
        packname,
        author,
      });
    }

    const { top, bottom } = parseText(m.text);

    const form = new FormData();

    form.append("image", buffer.toString("base64"));

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      {
        headers: form.getHeaders(),
      },
    );

    const imageUrl = upload.data.data.url;

    const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(imageUrl)}`;

    const memeRes = await axios.get(memeUrl, {
      responseType: "arraybuffer",
    });

    return conn.sendSticker(m.chat, {
      sticker: memeRes.data,
      packname,
      author,
    });
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
