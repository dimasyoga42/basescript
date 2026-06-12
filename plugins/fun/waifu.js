import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get("https://neurapi.mochinime.cyou/api/etc/waifu");
    const data = res.data;
    const image = data.url;
    console.log(image);
    sendImage(conn, m.chat, image, `${data.character}`, m);
  } catch (err) {
    sendText(conn, m.chat, `log: ${err.message}`, m);
  }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
