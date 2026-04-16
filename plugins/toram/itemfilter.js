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
    let query = text.replace(/^\.itemfilter\s*/i, "").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        {
          text: "Contoh: .itemfilter atk speed --wep\n\nCategory:\n--wep\n--add\n--ring",
        },
        { quoted: m },
      );
    }

    // 🔥 detect flag
    let categoryFilter = null;

    if (/--add/i.test(query)) {
      categoryFilter = "Additional";
      query = query.replace(/--add/gi, "").trim();
    }

    if (/--wep/i.test(query)) {
      categoryFilter = "Weapon";
      query = query.replace(/--wep/gi, "").trim();
    }

    if (/--ring/i.test(query)) {
      categoryFilter = "Ring";
      query = query.replace(/--ring/gi, "").trim();
    }

    // 🔥 split keyword (biar sensitif)
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

    let db = supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom");

    // 🔥 apply multi keyword (AND)
    keywords.forEach((k) => {
      db = db.ilike("Effects", `%${k}%`);
    });

    // 🔥 category filter
    if (categoryFilter) {
      db = db.eq("Category", categoryFilter);
    }

    const { data, error } = await db.limit(20);

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

    // ✅ kalau cuma 1
    if (data.length === 1) {
      return conn.sendMessage(
        m.chat,
        { text: formatItem(data[0]).trim() },
        { quoted: m },
      );
    }

    // ✅ kalau banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan ${data.length} item untuk: "${query}"${
        categoryFilter ? ` (${categoryFilter})` : ""
      }\nPilih salah satu:`,
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
