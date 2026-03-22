import axios from "axios";
import { config } from "../../config.js";
import { sendImage, sendText, sendVideo } from "../../src/config/message.js";

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
      return sendText(conn, m.chat, config.message.notFound, m);
    const { images, videos } = data.result.media;
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await sendImage(conn, m.chat, img, "hasil download", m);
      }
      return;
    }
    if (Array.isArray(videos) && videos.length > 0) {
      for (const vid of videos) {
        await sendVideo(conn, m.chat, vid, "hasil download", m);
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
