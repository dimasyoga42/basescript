import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(
      "https://neurapi.mochinime.cyou/api/etc/pixiv/search",
      { params: { query: "AnimeGril" } },
    );
    const data = res.data;

    if (!data?.success || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error("Gagal mengambil list waifu dari pencarian.");
    }

    const list = data.data;
    const randomItem = list[Math.floor(Math.random() * list.length)];

    const caption =
      `🎴 *${randomItem.title || "Untitled"}*\n` +
      `👤 Artist : ${randomItem.user || "-"}\n` +
      `🔗 Source : https://pixiv.net${randomItem.detail}`;

    await sendImage(conn, m.chat, randomItem.thumbnail, caption, m);
  } catch (err) {
    console.error("[waifu]", err);
    sendText(conn, m.chat, `log: ${err.message}`, m);
  }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";

export default handler;
