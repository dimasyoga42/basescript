import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    sendText(conn, m.chat, config.upbag, m);
  } catch (err) {}
};

handler.command = ["upbag"];
handler.category = "Menu Toram";
handler.submenu = "Toram";
export default handler;
