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

    if (!data?.success || !data?.image) {
      throw new Error("Gagal mengambil data waifu, response tidak valid.");
    }

    const caption =
      `🎴 *${data.character || "Unknown"}*\n` +
      `👤 Artist : ${data.user || "-"}\n` +
      `❤️ Like : ${data.likeCount ?? 0} | 🔖 Bookmark : ${data.bookmarkCount ?? 0} | 👁️ View : ${data.viewCount ?? 0}\n` +
      `🔗 Source : ${data.link || "-"}`;

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
