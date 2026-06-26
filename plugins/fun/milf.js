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
      `https://neurapi.mochinime.cyou/api/etc/pixiv/search?query=MILF&page=${randomPage}`,
    );
    const data = res.data;
    console.log(data);
    if (
      !data?.success ||
      !Array.isArray(data?.data) ||
      data.data.length === 0
    ) {
      return sendText(conn, m.chat, "gagal nih harap di ulang", m);
    }

    const items = data.data;
    const randomItem = items[Math.floor(Math.random() * items.length)];

    if (!randomItem?.thumbnail) {
      return sendText(conn, m.chat, "gagal nih harap di ulang", m);
    }

    const cleanedThumbnail = randomItem.thumbnail
      .replace("/c/250x250_80_a2/img-master/", "/img-master/")
      .replace("/c/250x250_80_a2/custom-thumb/", "/img-master/");

    const image = `https://neurapi.mochinime.cyou/api/etc/pixiv/image?url=${cleanedThumbnail}`;

    sendImage(conn, m.chat, image, "ini adalah milf kesukaan mu", m);
  } catch (err) {
    sendText(conn, m.chat, "gagal nih harap di ulang", m);
  }
};
handler.command = ["milf"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
