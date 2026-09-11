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
      sendText(conn, m.chat, "replay / caption dengan .bgremove")
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
      `https://api.neoxr.eu/api/nobg?image=${encodeURIComponent(imgUrl)}&apikey=${process.env.NOXER}`,
    );


    const hdImageUrl = hdRes.data?.data?.no_background || hdRes.data?.no_background;
    if (!hdImageUrl) throw sendText(conn, m.chat, "Upscale API gagal atau format response berubah", m);

    const { data: imageBuffer } = await axios.get(hdImageUrl, {
      responseType: "arraybuffer",
    });

    await sendImage(conn, m.chat, imageBuffer, "Result", m);
  } catch (err) {
    console.error(err);
    sendText(conn, m.chat, err, m)
  }
};

handler.command = "bgremove";
handler.category = "Menu Tools";
handler.submenu = "Tools";

export default handler;
