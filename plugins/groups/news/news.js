import { getUserData } from "../../../src/config/func.js";
import path from "path";
import { sendFancyText } from "../../../src/config/message.js";
import { config, thumbnail } from "../../../config.js";
const db = path.resolve("db", "News.json");
const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us")) return;
    let data = await getUserData(db);
    if (!Array.isArray(data) || data.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound,
        quoted: m,
      });
    const newsData = data.find((item) => item.id === m.chat);
    if (!newsData || !newsData.news) {
      return conn.sendMessage(
        m.chat,
        {
          text: "Belum ada news di grup ini\ngunakan .setnews untuk menambahkan berita",
        },
        { quoted: m },
      );
    }
    const message = `
    ${newsData.news}
    `.trim();

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: message,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["news"];
handler.category = "Menu Grub";
handler.submenu = "grub";
export default handler;
