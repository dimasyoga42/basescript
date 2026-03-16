import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
const handler = async (m, { conn }) => {
  try {
    const query = m.text.split(" ").slice(1).join(" ");
    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .ability nama",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });

    const res = await axios.get(
      `${config.restapi.toram}toram/ability?name=${encodeURIComponent(query)}`,
    );
    const data = res.data.result?.data ?? res.data.result;

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

    sendText(conn, m.chat, mtext, m);
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

handler.command = ["tirait"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
