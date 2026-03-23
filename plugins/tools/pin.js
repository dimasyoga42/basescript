import axios from "axios";
import { sendText } from "../../src/config/message.js";
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

    await sendText(conn, m.chat, "Mencari...", m);

    const res = await axios.get(
      `https://api.deline.web.id/search/pinterest?q=${encodeURIComponent(query)}`,
      { timeout: 10000 },
    );

    const data = res.data?.data;
    if (!Array.isArray(data) || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    const images = data.slice(0, 10).map((item, i) => ({
      image: { url: item.image },
      caption: i === 0 ? `*${query}*\nPinterest` : "",
    }));

    await conn.sendAlbum(m.chat, images, { quoted: m });
  } catch (err) {
    console.error("[pinterest]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["pin"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
