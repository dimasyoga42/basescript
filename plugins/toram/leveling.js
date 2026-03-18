import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    sendText(conn, m.chat, config.leveling, m);
  } catch (err) {}
};

handler.command = ["listleveling"];
handler.category = "Menu Toram";
handler.submenu = "Toram";
export default handler;
