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

const buildSticker = async (buffer, packname, author) => {
  const sticker = new Sticker(buffer, {
    pack: packname,
    author: author,
    type: StickerTypes.FULL,
    categories: ["🤩", "🎉"],
    quality: 70,
  });
  return sticker.toBuffer();
};

const uploadToImgbb = async (buffer) => {
  if (!process.env.BBI_KEY) {
    throw new Error("BBI_KEY tidak ditemukan di environment variable");
  }

  const form = new FormData();
  form.append("image", buffer.toString("base64"));

  try {
    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      },
    );

    const url = upload.data?.data?.url;
    if (!url) {
      throw new Error("imgbb tidak mengembalikan url gambar");
    }
    return url;
  } catch (err) {
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    throw new Error(`Upload imgbb gagal: ${detail}`);
  }
};

const handler = async (m, { conn }) => {
  try {
    const mediaMsg = getMediaMessage(m);
    if (!mediaMsg) {
      return sendText(conn, m.chat, "Reply gambar/video dengan .stiker\nContoh: .stiker Halo | Dunia", m);
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

    if (!buffer || buffer.length === 0) {
      throw new Error("Gagal mengunduh media, buffer kosong");
    }

    if (mediaMsg.message?.videoMessage) {
      const stickerBuffer = await buildSticker(buffer, packname, author);
      return conn.sendMessage(
        m.chat,
        { sticker: stickerBuffer },
        { quoted: m },
      );
    }

    const { top, bottom } = parseText(m.text);
    const imageUrl = await uploadToImgbb(buffer);
    const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(imageUrl)}`;

    const memeRes = await axios.get(memeUrl, {
      responseType: "arraybuffer",
    });

    const stickerBuffer = await buildSticker(
      Buffer.from(memeRes.data),
      packname,
      author,
    );

    return conn.sendMessage(
      m.chat,
      { sticker: stickerBuffer },
      { quoted: m },
    );
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
