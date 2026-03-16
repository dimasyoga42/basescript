import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const leng = arg[1];
    if (!leng)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .mq id/en",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
  } catch (err) {}
};

handler.command = ["mq"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
