import { config } from "../../config.js";
import { sendFancyTextModif, sendImage } from "../../src/config/message.js";

const handler = (m, { conn }) => {
  try {
    sendImage(
      conn,
      m.chat,
      `https://api.deline.web.id/random/loli`,
      "ini loli anda",
      m,
    );
  } catch (err) {}
};

handler.command = "loli";
handler.alias = ["pdf"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
