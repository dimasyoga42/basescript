import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const formatStats = (stats = "") =>
  stats
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && !/^amount$/i.test(s))
    .join("\n");

const handler = async (m, { conn }) => {
  try {
    const parts = (m.text || "").trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "Contoh: .item nama item" },
        { quoted: m },
      );
    }

    // PRIORITAS 1: exact match
    const { data: exactData, error: exactError } = await supa
      .from("item")
      .select("ItemName, Category, Process, Duration, Effects")
      .ilike("ItemName", query)
      .limit(1);

    if (!exactError && exactData && exactData.length === 1) {
      const item = exactData[0];

      const text = `*${item.ItemName}* ${item.Category || "-"}
${formatStats(item.Effects)}

proses:
- ${item.Process || "-"}
- ${item.Duration || "-"}`.trim();

      return conn.sendMessage(m.chat, { text }, { quoted: m });
    }

    // PRIORITAS 2: partial match
    const { data, error } = await supa
      .from("item")
      .select("ItemName, Category, Process, Duration, Effects")
      .ilike("ItemName", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "item tidak ditemukan" },
        { quoted: m },
      );
    }

    // kalau cuma 1 hasil
    if (data.length === 1) {
      const item = data[0];

      const text = `*${item.ItemName}* ${item.Category || "-"}
${formatStats(item.Effects)}

proses:
- ${item.Process || "-"}
- ${item.Duration || "-"}`.trim();

      return conn.sendMessage(m.chat, { text }, { quoted: m });
    }

    // kalau banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan ${data.length} item untuk: "${query}"\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.ItemName,
          id: `.item ${item.ItemName}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Menu Item",
    });
  } catch (err) {
    console.log("ERR ITEM:", err.message);
    await conn.sendMessage(
      m.chat,
      { text: "terjadi error tidak terduga" },
      { quoted: m },
    );
  }
};

handler.command = "item";
handler.category = "Toram Search";

export default handler;
