import { config, thumbnail } from "../../config.js";
import { buildSelectButton, sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = (m.text || "").trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    // 🔥 kalau tidak ada query → tampilkan semua ability (button)
    if (!query) {
      const { data, error } = await supa
        .from("abilityv2")
        .select("name");

      if (error || !data || data.length === 0)
        return sendText(conn, m.chat, config.message.notFound, m);

      return await conn.sendButton(m.chat, {
        text: `Pilih salah satu ability:`,
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "Daftar Trait",
            "Silahkan pilih salah satu",
            data.map((item) => ({
              title: item.name,
              description: `Lihat Stat dari ${item.name}`,
              id: `.trait ${item.name}`

            }))
          )
        ],
        bottom_sheet: true,
        bottom_name: "Menu Ability",
      });
    }

    // 🔥 PRIORITAS 1: exact match
    const { data: exactData, error: exactError } = await supa
      .from("abilityv2")
      .select("*")
      .ilike("name", query)
      .limit(1);

    if (!exactError && exactData && exactData.length === 1) {
      const item = exactData[0];
      return sendText(conn, m.chat, `*${item.name}*\n\n${item.stat_effect}`, m);
    }

    // 🔥 PRIORITAS 2: partial match
    const { data, error } = await supa
      .from("abilityv2")
      .select("*")
      .ilike("name", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    // 🔥 kalau cuma 1 hasil
    if (data.length === 1) {
      const item = data[0];
      return sendText(conn, m.chat, `*${item.name}*\n\n${item.stat_effect}`, m);
    }

    // 🔥 kalau banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* ability untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: [
        buildSelectButton(
          "Daftar Trait",
          "Silahkan pilih salah satu",
          data.map((item) => ({
            title: item.name,
            description: `Lihat Stat dari ${item.name}`,
            id: `.trait ${item.name}`

          }))
        )
      ],
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
