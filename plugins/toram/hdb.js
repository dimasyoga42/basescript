import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const name = arg[1];
    if (!name)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound,
        quoted: m,
      });
    const { data } = await supa
      .from("hdb")
      .select("bosname, stat")
      .ilike("bosname", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (!data)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound,
        quoted: m,
      });
    sendFancyText(conn, m.chat, {
      title: data.bosname,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: data.stat,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};
handler.command = ["hdb"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
