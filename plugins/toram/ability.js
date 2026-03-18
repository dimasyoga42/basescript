import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/\.trait|.ability/, "").trim();
    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .ability nama",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });

    const { data } = await supa
      .from("ability")
      .select("*")
      .ilike("name", `%${query}%`);
    if (!data || data.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });

    const mtext = data
      .map((item) => `${item.name}\n${item.stat_effect}`)
      .join("\n\n");

    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: mtext,
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

handler.command = "trait";
handler.alias = ["ability"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
