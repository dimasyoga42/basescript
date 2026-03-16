import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import * as cheerio from "cheerio";
const handler = async (m, { conn }) => {
  try {
    const res = await axios.get(
      `http://id.toram.jp/?type_code=update#contentArea`,
    );
    const sup = cheerio.load(res.data);
    const b = sup(".common_list").find(".news_border:nth-child(1)");
    let link = `http://id.toram.jp` + sup(b).find("a").attr("href");
    const des = await axios.get(link);
    const soup = cheerio.load(des.data);
    const result = soup("#news").find("div").text().trim();
    const reg = result.split("Kembali ke atas")[0];
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: reg,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["mt"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
