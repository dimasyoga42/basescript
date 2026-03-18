import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Ini hanya perkiraan saja`,
      thumbnail: thumbnail,
      text: config.upbag,
      quoted: m,
    });
  } catch (err) {}
};

handler.command = ["upbag"];
handler.category = "Menu Toram";
handler.submenu = "Toram";
export default handler;
