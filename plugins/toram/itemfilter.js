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
    const text = m.text || "";
    const query = text.replace(/^\.itemfilter\s*/i, "").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "Contoh: .itemfilter atk / motion speed" },
        { quoted: m },
      );
    }

    // ✅ search berdasarkan Effects
    const { data, error } = await supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom")
      .ilike("Effects", `%${query}%`)
      .limit(20);

    if (error) {
      console.log("ERR ITEM FILTER:", error.message);
      return conn.sendMessage(
        m.chat,
        { text: "terjadi kesalahan saat mengambil data" },
        { quoted: m },
      );
    }

    if (!data || data.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "item dengan stat tersebut tidak ditemukan" },
        { quoted: m },
      );
    }

    // ✅ kalau cuma 1 → tampil detail
    if (data.length === 1) {
      return conn.sendMessage(
        m.chat,
        { text: formatItem(data[0]).trim() },
        { quoted: m },
      );
    }

    // ✅ kalau banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan ${data.length} item dengan stat: "${query}"\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.ItemName,
          id: `.item ${item.ItemName}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Filter Item",
    });
  } catch (err) {
    console.log("ERR ITEM FILTER:", err.message);
    await conn.sendMessage(
      m.chat,
      { text: "terjadi error tidak terduga" },
      { quoted: m },
    );
  }
};

handler.command = "itemfilter";
handler.category = "Toram Search";

export default handler;
