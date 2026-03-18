import { downloadMediaMessage } from "@whiskeysockets/baileys";
import axios from "axios";
import FormData from "form-data";
import { sendText } from "../../src/config/message.js";
import { config } from "../../config.js";

const ENHANCE_API = "https://api.neoxr.eu/api/remini";
const IMGBB_API = "https://api.imgbb.com/1/upload";

const getMedia = (m) => {
  if (m.message?.imageMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quoted?.imageMessage ? { message: quoted } : null;
};

const handler = async (m, { conn }) => {
  try {
    const mediaMsg = getMedia(m);
    if (!mediaMsg)
      return sendText(conn, m.chat, "Kirim/reply gambar dengan .remini", m);

    await sendText(conn, m.chat, "Sedang diproses...", m);

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage },
    );

    const form = new FormData();
    form.append("image", buffer.toString("base64"));

    const { data } = await axios.post(
      `${IMGBB_API}?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() },
    );

    if (!data?.data?.url) throw new Error("Upload ke imgbb gagal");

    const enhance = await axios.get(
      `${ENHANCE_API}?image=${encodeURIComponent(data.data.url)}&apikey=${process.env.NOXER}`,
    );

    const result = enhance.data?.data?.url || enhance.data?.url;
    if (!result?.startsWith("http"))
      throw new Error(`Response tidak valid: ${JSON.stringify(enhance.data)}`);

    await conn.sendMessage(
      m.chat,
      { image: { url: result }, caption: "Berhasil ditingkatkan!" },
      { quoted: m },
    );
  } catch (err) {
    console.error("[REMINI]", err?.response?.data || err);
    await sendText(
      conn,
      m.chat,
      `${err?.response?.data?.message || err?.message || config.message.error}`,
      m,
    );
  }
};

handler.command = ["remini"];
handler.category = "Menu Tools";
handler.submenu = "Image";
export default handler;
