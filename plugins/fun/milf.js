import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const randomPage = Math.floor(Math.random() * 60) + 1;
    const res = await axios.get(
      `https://api.nekosapi.com/v4/images/random?rating=safe&limit=1&tags=catgirl`,
    );
    const data = res.data;
    console.log(data);

  sendImage(conn, m.chat, data[0].url, "ini adalah ras kucing kesukaan mu", m);
  } catch (err) {
    sendText(conn, m.chat, "gagal nih harap di ulang", m);
  }
};
handler.command = ["catgirl"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
