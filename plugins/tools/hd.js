import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendImage, sendText } from "../../src/config/message.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";

const getType = (m) => {
  if (m.message?.imageMessage || m.message?.videoMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted };
  }
  return null;
};

const handler = async (m, { conn }) => {
  try {
    const type = getType(m);
    if (!type) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: config.message.invalid,
        thumbnail: thumbnail,
        text: "Kirim atau reply gambar, lalu ketik .hd",
        quoted: m,
      });
    }

    const buffer = await downloadMediaMessage(
      type,
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

    const imgUrl = upload.data?.data?.url;
    if (!imgUrl) throw new Error("Upload ke imgbb gagal");

    await sendText(conn, m.chat, "tunggu...");

    const hdRes = await axios.get(
      `https://api.neoxr.eu/api/upscale?image=${encodeURIComponent(imgUrl)}&apikey=${process.env.NOXER}`,
    );

    // Sesuaikan path field ini dengan struktur response asli dari neoxr,
    // ini asumsi umum untuk API neoxr (data.data.url atau data.url)
    const hdImageUrl = hdRes.data?.data?.url || hdRes.data?.url;
    if (!hdImageUrl) throw new Error("Upscale API gagal atau format response berubah");

    const { data: imageBuffer } = await axios.get(hdImageUrl, {
      responseType: "arraybuffer",
    });

    await sendImage(conn, m.chat, imageBuffer, "HD Result", m);
  } catch (err) {
    console.error(err);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = "hd";
handler.category = "Menu Tools";
handler.submenu = "Tools";

export default handler;
