import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendFancyTextModif,
  sendText,
  sendVideo,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const link = m.text.replace(/\.tt|.tiktok/, "").trim();
    if (!link) return sendText(conn, m.chat, config.message.invalid, m);
    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(link)}`,
      { timeout: 15000 },
    );
    if (!data?.status || !data?.result)
      return sendText(conn, m.chat, config.message.notFound, m);

    const result = data.result;

    const title = result.title || "video tiktok";
    const username = result.author?.unique_id || "unknown";
    const nickname = result.author?.nickname || "";
    const avatar = result.author?.avatar;
    const videoUrl = result.download;
    //const musicUrl = result.music;
    if (!videoUrl) return sendText(conn, m.chat, config.message.notFound, m);
    const namepage = m.pushName;
    if (avatar)
      return sendFancyTextModif(conn, m.chat, {
        title: config.BotName,
        body: `develop by: ${config.OwnerName}`,
        thumbnail: avatar,
        name: namepage,
        text: `${title}\nname: ${nickname}\nUsername: ${username}`,
      });
    console.log(videoUrl);
    sendVideo(conn, m.chat, videoUrl, "video result", m);
  } catch (err) {
    sendText(conn, m.chat, err.message, m);
  }
};

handler.command = "tt";
handler.alias = ["tiktok"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
