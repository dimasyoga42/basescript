import { config, thumbnail } from "../../config.js";
import { sendMenu } from "../../src/config/message";

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
    sendMenu(conn, m.chat, {
      title: config.BotName,
      body: "Neura Inc Development",
      text: "Saran Anda telah Dikirim ke Owner Bot",
      thumbnail: thumbnail,
      renderLargerThumbnail: false,
    });
  } catch (err) {
    console.log(err.message);
  }
};

handler.command = "saran";
handler.category = "Menu Bot";
export default handler;
