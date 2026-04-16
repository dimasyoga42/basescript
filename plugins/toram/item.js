import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const formatStats = (stats = "") =>
  stats
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && !/^amount$/i.test(s))
    .join("\n");

const formatItem = (item) => `*${item.ItemName}* ${item.Category || "-"}
${formatStats(item.Effects)}

proses:
- ${item.Process || "-"}
- ${item.Duration || "-"}
- ${item.ObtainedFrom || "-"}`;

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

    // ✅ EXACT MATCH (ambil semua kemungkinan duplicate)
    const { data: exactData, error: exactError } = await supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom")
      .ilike("ItemName", query);

    if (!exactError && exactData && exactData.length > 0) {
      // kalau cuma 1
      if (exactData.length === 1) {
        return conn.sendMessage(
          m.chat,
          { text: formatItem(exactData[0]).trim() },
          { quoted: m },
        );
      }

      // ✅ kalau duplicate (>1) → tampilkan semua
      const text = exactData.map((item) => formatItem(item)).join("\n\n");

      return conn.sendMessage(m.chat, { text }, { quoted: m });
    }

    // ✅ PARTIAL MATCH
    const { data, error } = await supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom")
      .ilike("ItemName", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "item tidak ditemukan" },
        { quoted: m },
      );
    }

    // kalau cuma 1
    if (data.length === 1) {
      return conn.sendMessage(
        m.chat,
        { text: formatItem(data[0]).trim() },
        { quoted: m },
      );
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
