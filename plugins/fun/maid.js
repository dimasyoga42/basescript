import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(`${config.restapi.maid}`);
    const data = res.data;
    const image = data.items[0].url;
    console.log(image);

    sendImage(conn, m.chat, image, "ini adalah maid kesukaan mu", m);
  } catch (err) {
    sendText(conn, m.chat, "gagal nih harap di ulang", m);
  }
};

// handler.command = ["maid"];
// handler.category = "Menu Fun";
// handler.submenu = "Fun";
// export default handler;
