import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = (m.text || "").trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "Contoh: .xtal nama" },
        { quoted: m },
      );
    }

    // ✅ mode --all
    if (query === "--all") {
      const { data: db, error } = await supa.from("xtal").select("name");

      if (error || !db || db.length === 0) {
        return conn.sendMessage(
          m.chat,
          { text: "data xtal kosong / error" },
          { quoted: m },
        );
      }

      return await conn.sendButton(m.chat, {
        text: `Pilih salah satu:`,
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.xtal ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "List Xtal",
      });
    }

    // ✅ PRIORITAS 1: exact match
    const { data: exactData, error: exactError } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .eq("name", query)
      .limit(1);

    if (!exactError && exactData && exactData.length === 1) {
      const item = exactData[0];

      const text = `*${item.name}* ${item.type || "-"}
${item.stats || "-"}

rute:
- ${item.upgrade_route || "-"}
- ${item.max_upgrade_route || "-"}`.trim();

      const routes = (item.max_upgrade_route || "")
        .split("->")
        .map((x) => x.trim())
        .filter(Boolean);

      if (routes.length === 0) {
        return conn.sendMessage(m.chat, { text }, { quoted: m });
      }

      return conn.sendButton(m.chat, {
        text: text,
        footer: config.BotName,
        buttons: routes.map((r) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: r,
            id: `.xtal ${r}`,
          }),
        })),
      });
    }

    // ✅ PRIORITAS 2: partial match
    const { data, error } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "xtal tidak ditemukan" },
        { quoted: m },
      );
    }

    // ✅ kalau cuma 1 hasil
    if (data.length === 1) {
      const item = data[0];

      const text = `*${item.name}* ${item.type || "-"}
${item.stats || "-"}

rute:
- ${item.upgrade_route || "-"}
- ${item.max_upgrade_route || "-"}`.trim();

      const routes = (item.max_upgrade_route || "")
        .split("->")
        .map((x) => x.trim())
        .filter(Boolean);

      if (routes.length === 0) {
        return conn.sendMessage(m.chat, { text }, { quoted: m });
      }

      return conn.sendButton(m.chat, {
        text: text,
        footer: config.BotName,
        buttons: routes.map((r) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: r,
            id: `.xtal ${r}`,
          }),
        })),
      });
    }

    // ✅ kalau banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* xtal untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Menu Xtal",
    });
  } catch (err) {
    console.log("ERR XTAL:", err.message);
    await conn.sendMessage(
      m.chat,
      { text: "terjadi error tidak terduga" },
      { quoted: m },
    );
  }
};

handler.command = "xtall";
handler.alias = ["xtal"];
handler.category = "Toram Search";

export default handler;
