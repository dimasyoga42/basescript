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
          text: "Contoh: .itemfilter atk --wep\n\nCategory yang tersedia:\n--ohs\n--bwg\n--hb\n--ths\n--staff\n--knuck\n--bow\n--dagger\n--arrow\n--add\n--ring",
        },
        { quoted: m },
      );
    }

    // 🔥 detect flag
    let categoryFilter = null;
    let perbandingan = null;
    let dbStat = [];
    if (/--add/i.test(query)) {
      categoryFilter = "Additional";
      query = query.replace(/--add/gi, "").trim();
    }

    if (/--ohs/i.test(query)) {
      categoryFilter = "1 Handed Sword";
      query = query.replace(/--ohs/gi, "").trim();
    }
    if (/--ths/i.test(query)) {
      categoryFilter = "2 Handed Sword";
      query = query.replace(/--ths/gi, "").trim();
    }
    if (/--bow/i.test(query)) {
      categoryFilter = "Bow";
      query = query.replace(/--bow/gi, "").trim();
    }
    if (/--bwg/i.test(query)) {
      categoryFilter = "Bowgun";
      query = query.replace(/--bwg/gi, "").trim();
    }
    if (/--hb/i.test(query)) {
      categoryFilter = "Halberd";
      query = query.replace(/--hb/gi, "").trim();
    }
    if (/--staff/i.test(query)) {
      categoryFilter = "Staff";
      query = query.replace(/--staff/gi, "").trim();
    }
    if (/--knuck/i.test(query)) {
      categoryFilter = "Knuckles";
      query = query.replace(/--knuck/gi, "").trim();
    }
    if (/--dagger/i.test(query)) {
      categoryFilter = "Dagger";
      query = query.replace(/--dagger/gi, "").trim();
    }
    if (/--arrow/i.test(query)) {
      categoryFilter = "Arrow";
      query = query.replace(/--arrow/gi, "").trim();
    }
    if (/--ring/i.test(query)) {
      categoryFilter = "Special";
      query = query.replace(/--ring/gi, "").trim();
    }
    if (/>/i.test(query)) {
      perbandingan = ">";
      const { data, err } = supa
        .from("item_v2")
        .select("Effects, Category")
        .ilike("Effects", `${query}`)
        .eq("Category", categoryFilter);
      dbStat.push(data);
    }
    if (/</i.test(query)) {
      return (perbandingan = "<");
    }
    // 🔥 build query
    let db = supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom")
      .ilike("Effects", `%${query}%`);

    // apply filter category kalau ada
    if (categoryFilter) {
      db = db.eq("Category", categoryFilter);
    }

    const { data, error } = await db;

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
      text: `Ditemukan ${data.length} item dengan stat: "${query}"${
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
