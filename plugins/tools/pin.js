import axios from "axios";
import { reactMessage, sendText } from "../../src/config/message.js";
import { config } from "../../config.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.pin\s*/i, "").trim();
    if (!query)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}\nuse .pin any`,
        m,
      );

    await reactMessage(conn, m.chat, m, "⌛");

    const res = await axios.get(
      `https://api.neoxr.eu/api/pinterest-v2?q=${encodeURIComponent(query)}&show=20&type=image&apikey=${process.env.NOXER}`,
      { timeout: 10000 },
    );

    const data = res.data?.data;
    if (!Array.isArray(data) || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    const valid = data
      .filter((item) => item?.content?.[0]?.url && !item.is_video)
      .slice(0, 10);

    if (valid.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    const images = valid.map((item, i) => ({
      image: { url: item.content[0].url },
      caption: i === 0 ? `🖼️ *${query}*\nPinterest` : "",
    }));

    await conn.sendAlbum(m.chat, images, { quoted: m });
  } catch (err) {
    console.error("[pinterest]", err.message);

    const msg =
      err.code === "ECONNABORTED"
        ? "Request timeout, coba lagi."
        : err.response?.status === 401
          ? "API key tidak valid."
          : err.response?.status === 404
            ? "API tidak ditemukan."
            : config.message.error;

    await sendText(conn, m.chat, msg, m);
  }
};

// handler.command = ["pin"];
// handler.category = "Menu Tools";
// handler.submenu = "Tools";
export default handler;
