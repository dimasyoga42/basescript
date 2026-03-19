import axios from "axios";
import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const link = m.text.replace(/\.ig/, "");
    if (!link)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}\nuse: .ig link`,
        m,
      );

    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/ig?url=${encodeURIComponent(link)}`,
      { timeout: 15000 },
    );
    if (!data?.status || !data?.result?.media)
      return sendText(conn, m.cat, config.message.notFound, m);
    const { images, videos } = data.result.media;
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await conn.sendMessage(m.chat, { image: { url: img } }, { quoted: m });
      }
      return;
    }
    if (Array.isArray(videos) && videos.length > 0) {
      for (const vid of videos) {
        await conn.sendMessage(chatId, { video: { url: vid } }, { quoted: m });
      }
      return;
    }
    sendText(conn, m.chat, config.message.notFound, m);
  } catch (err) {
    sendText(conn, m.chat, config.message.error, m);
  }
};
handler.command = "ig";
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
