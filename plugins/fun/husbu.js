import axios from "axios";
import { sendImage } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(
      `https://api.neoxr.eu/api/husbu?apikey=${process.env.NOXER}`,
    );
    const data = res.data;
    sendImage(conn, m.chat, data.url, "ini adalah husbu anda hari ini", m);
  } catch (err) {
    conn.sendMessage(
      m.chat,
      {
        text: `terjadi kesalahan saat mengambil data dari server silahkan di ulang kembali`,
      },
      { quoted: m },
    );
  }
};

handler.command = "husbu";
handler.category = "Menu Fun";
export default handler;
