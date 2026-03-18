import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.split(" ").slice(1).join(" ");
    if (!query)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}, use: .regis name`,
      );

    const res = await axios.get(
      `${config.restapi.neura}/regis?name=${encodeURIComponent(query)}`,
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
      .map(
        (item) =>
          `${item.name}\n${item.effect}\nMax Level:\n- ${item.max_lv}\nLevel Stode:\n- ${item.levels_studied}`,
      )
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

handler.command = ["regis"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
