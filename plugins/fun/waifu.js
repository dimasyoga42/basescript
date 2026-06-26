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
    console.log(data);

    if (!data?.success || !data?.image) {
      throw new Error("Gagal mengambil data waifu, response tidak valid.");
    }

    const caption = `Waifu anda adalah ${data.character}`;

    await sendImage(conn, m.chat, data.image, caption, m);
  } catch (err) {
    console.error("[waifu]", err);
    sendText(conn, m.chat, `log: ${err.message}`, m);
  }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";

export default handler;
