import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text || "";
    const query = text.replace(/^\.statsxtal\s*/i, "").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "masukan stat xtal yang ingin anda cari setelah cmd" },
        { quoted: m },
      );
    }

    const { data, error } = await supa
      .from("xtal")
      .select("name, stats")
      .ilike("stats", `%${query}%`)
      .limit(20);

    if (error) {
      console.log("ERR STATS XTAL:", error.message);
      return conn.sendMessage(
        m.chat,
        { text: "terjadi kesalahan saat mengambil data" },
        { quoted: m },
      );
    }

    if (!data || data.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "stat yang dicari tidak ditemukan" },
        { quoted: m },
      );
    }

    // ✅ kalau cuma 1 → langsung redirect ke xtal detail
    if (data.length === 1) {
      return conn.sendMessage(
        m.chat,
        { text: `.xtal ${data[0].name}` },
        { quoted: m },
      );
    }

    // ✅ kalau banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan ${data.length} xtal dengan stat: "${query}"\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "List Xtal",
    });
  } catch (err) {
    console.log("ERR STATS XTAL:", err.message);
    await conn.sendMessage(
      m.chat,
      { text: "terjadi error tidak terduga" },
      { quoted: m },
    );
  }
};

handler.command = "statsxtal";
handler.category = "Toram Search";

export default handler;
