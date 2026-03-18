import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = (m, { conn }) => {
  try {
    const query = m.text.replace(".kerang", "").trim();
    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `use .kerang any`,
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    const key = Math.floor(Math.random() * config.kerang.length);
    const valueMessage = config.kerang[key];

    sendText(conn, m.text, valueMessage, m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["kerang"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
