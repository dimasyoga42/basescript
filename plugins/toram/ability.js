import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = m.text.trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();
    console.log(query);
    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "Contoh: .ability nama",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

    const { data, error } = await supa
      .from("ability")
      .select("*")
      .ilike("name", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    if (data.length === 1) {
      const item = data[0];
      return sendText(conn, m.chat, `*${item.name}*\n\n${item.stat_effect}`, m);
    }

    await conn.sendButton(m.chat, {
      image: thumbnail, // ❗ jangan pakai { url: thumbnail }
      caption: "Pilih ability untuk melihat detail:",
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.trait ${item.name}`,
        }),
      })),
      bottom_sheet: true, //kalau mau button dalam button
      bottom_name: "menu Ability",
    });
  } catch (err) {
    console.error("[ability]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = "trait";
handler.alias = ["ability"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
