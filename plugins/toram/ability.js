import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = m.text.trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "Contoh: .ability nama",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });
    if (query === "--all") {
      const { data: db, error: dbError } = supa.from("ability").select("*");

      return await conn.sendButton(m.chat, {
        text: `Pilih salah satu:`,
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.trait ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "List Ability",
      });
    }
    // Prioritas 1: exact match (nama persis sama, case-insensitive)
    const { data: exactData, error: exactError } = await supa
      .from("ability")
      .select("*")
      .ilike("name", query)
      .limit(1);

    if (!exactError && exactData && exactData.length === 1) {
      const item = exactData[0];
      return sendText(conn, m.chat, `*${item.name}*\n\n${item.stat_effect}`, m);
    }

    // Prioritas 2: partial match
    const { data, error } = await supa
      .from("ability")
      .select("*")
      .ilike("name", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    // Tepat 1 hasil
    if (data.length === 1) {
      const item = data[0];
      return sendText(conn, m.chat, `*${item.name}*\n\n${item.stat_effect}`, m);
    }

    // Lebih dari 1: tampilkan button pilihan
    await conn.sendButton(m.chat, {
      image: thumbnail,
      caption: `Ditemukan *${data.length}* ability untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.trait ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Menu Ability",
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
