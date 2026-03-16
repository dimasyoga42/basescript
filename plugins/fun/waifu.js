import axios from "axios";
import { config } from "../../config.js";
import { sendFancyText, sendImage } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(`${config.restapi.waifu}`);
    const data = res.data;
    const image = data.items[0].url;
    console.log(image);

    sendImage(conn, m.chat, image, "ini adalah waifu mu", m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: "Neura Sama",
      body: "waah gagal nih",
      text: "coba di ulang lagi",
      thumbnail:
        "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
      msg: m,
    });
  }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
