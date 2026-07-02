import { sendText } from "../../src/config/message.js";
import axios from "axios";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.(?:pixiv)\s*/i, "").trim();
    if (!query) {
      return sendText(
        conn,
        m.chat,
        "Format salah, masukkan teks setelah .pixiv",
        m,
      );
    }

    const { data } = await axios.get(
      `https://neurapi.mochinime.cyou/api/etc/pixiv/search?query=${encodeURIComponent(query)}`,
    );

    if (!data?.success || !Array.isArray(data.data) || data.data.length === 0) {
      return sendText(conn, m.chat, "Hasil tidak ditemukan.", m);
    }

    const result = data.data[Math.floor(Math.random() * data.data.length)];
    const imageUrl = result.thumbnail.replace(/\/c\/[^/]+\//, "/");
    const sourceUrl = `https://www.pixiv.net/artworks/${result.id}`;

    await conn.sendMessage(
      m.chat,
      {
        image: {
          url: `https://neurapi.mochinime.cyou/api/etc/pixiv/image?url=${encodeURIComponent(imageUrl)}`,
        },
        caption: `*${result.title || "Tanpa Judul"}*\n\nArtist: ${result.user || "-"}\nSource: ${sourceUrl}`,
      },
      { quoted: m },
    );
  } catch (err) {
    console.error(err);
    return sendText(conn, m.chat, "Terjadi kesalahan pada sistem.", m);
  }
};

handler.command = "pixiv";
handler.category = "Menu Tools";
export default handler;
