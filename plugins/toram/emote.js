import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(".emot", "").trim();
    if (!name)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .emot name",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    const { data } = await supa
      .from("emot")
      .select("name, url")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (!data)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    sendFancyText(conn, m.chat, {
      title: data.name,
      body: config.BotName,
      thumbnail: data.url,
      text: "klik tulisan nama emot",
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

handler.command = ["emot"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
