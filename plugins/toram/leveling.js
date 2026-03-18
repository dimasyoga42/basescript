import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `aku selalu setia`,
      thumbnail: thumbnail,
      text: config.leveling,
      quoted: m,
    });
  } catch (err) {}
};

handler.command = ["listleveling"];
handler.category = "Menu Toram";
handler.submenu = "Toram";
export default handler;
