import { config, thumbnail } from "../../../config.js";
import { getUserData, saveUserData } from "../../../src/config/func.js";
import { sendFancyText } from "../../../src/config/message.js";
import { isAdmin } from "../../_function/_admin.js";
import path from "path";

const db = path.resolve("db", "News.json");
const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const newstxt = m.text.split(/\s+/)[1]?.trim();
    if (!newstxt)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "use .setnews any",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    let data = await getUserData(db);

    if (!Array.isArray(data)) return (data = []);
    const index = data.findIndex((item) => item.id === m.chat);
    if (index !== -1) {
      data[index].news = newstxt;
    } else {
      data.push({
        id: m.chat,
        news: newstxt,
      });
    }
    saveUserData(db, data);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.create,
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

handler.command = ["setnews"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
