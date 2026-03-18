import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    // sendFancyText(conn, m.chat, {
    //   title: config.BotName,
    //   body: "Neura Disini",
    //   thumbnail: thumbnail,
    //   text: `${config.mq}`.trim(),
    //   quoted: m,
    // });
    sendText(conn, m.chat, config.mq, m);
  } catch (err) {}
};

handler.command = ["mq"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
