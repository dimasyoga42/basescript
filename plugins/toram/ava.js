import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(`${config.restapi.toram}toram/ava`);
    const { data } = res.data.result;

    data.map((item) => {
      sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: item.name,
        thumbnail: item.image,
        renderLargerThumbnail: true,
        text: `*${item.name}*\n${item.date}`,
        quoted: m,
      });
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      renderLargerThumbnail: true,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["ava"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
