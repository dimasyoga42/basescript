import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get("https://api.nekosapi.com/v4/images/random?rating=safe&limit=1");
    const data = res.data;
    console.log(data);

    const caption = `Waifu anda hari ini`;

    await sendImage(conn, m.chat, data.url, caption, m);
  } catch (err) {
    console.error("[waifu]", err);
    sendText(conn, m.chat, `log: ${err.message}`, m);
  }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";

export default handler;
