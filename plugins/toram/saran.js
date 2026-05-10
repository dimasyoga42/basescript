import { config, thumbnail } from "../../config.js";
import { sendMenu, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const msg = m.text.replace(/\.saran/, "").trim();
    if (!msg)
      return conn.sendMessage(
        m.chat,
        { text: "masukan saran setelah .saran" },
        { quoted: m },
      );
    conn.sendMessage("272206605082689@lid", { text: msg });
    sendText(conn, m.chat, "Saran Anda telah Dikirim ke Owner Bot", m);
  } catch (err) {
    console.log(err.message);
  }
};

handler.command = "saran";
handler.category = "Menu Bot";
export default handler;
