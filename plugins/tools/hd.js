import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendImage } from "../../src/config/message.js";
import { getContentType, downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";
const getType = (m) => {
  if (m.imageMessage || m.message?.videoMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted };
  }
  return null;
};

const handler = async (m, { conn }) => {
  try {
    const type = getType(m);
    if (!type)
      return sendFancyText(conn, m.chat, {
        text: config.BotName,
        body: config.message.invalid,
        thumbnail: thumbnail,
        text: "send or replay image and use .hd",
        quoted: m,
      });
    const buffer = await downloadMediaMessage(
      type,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage },
    );
    const form = new FormData();
    form.append("image", buffer.toString("base64"));
    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() },
    );

    const imgUrl = upload.data.data.url;
    const hdUrl = `https://api.deline.web.id/tools/hd?url=${encodeURIComponent(imgUrl)}`;
    sendFancyText(conn, m.chat, {
      text: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: "Waiting..",
      quoted: m,
    });
    sendImage(conn, m.chat, hdUrl, "HD Result", m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      text: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

// handler.command = ["hd"];
// handler.category = "Menu Tools";
// handler.submenu = "Tools";

// export default handler;
