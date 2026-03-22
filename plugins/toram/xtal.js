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
        `${config.message.invalid}, use: .xtal name`,
      );

    const { data } = await axios.get(
      "https://raw.githubusercontent.com/dimasyoga42/dataset/refs/heads/main/xtal_data.json",
    );

    if (!Array.isArray(data)) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    }

    const result = data.filter((x) =>
      x.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (!result || result.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });

    const mtext = result
      .map((xtall) => {
        const statsText = Object.entries(xtall.stats || {})
          .map(([key, val]) => {
            const cleanKey = key.replace(/\s+/g, " ").trim();

            const cleanVal = String(val)
              .replace(/\n+/g, " ")
              .replace(/\s{2,}/g, " ")
              .trim();

            return `${cleanKey} : ${cleanVal}`;
          })
          .join("\n- ");

        return `*${xtall.name} - ${xtall.type}*\n${statsText}\nUpgrade Route :\n- ${xtall.upgrade_route || "-"}\nMax Upgrade Route :\n- ${xtall.max_upgrade_route || "-"}\n────────────`;
      })
      .join("\n");

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

handler.command = "xtal";
handler.alias = ["xtall"]
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
