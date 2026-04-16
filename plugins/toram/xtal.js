import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text || "";
    const name = text.replace(/^\.xtal(l)?\s*/i, "").trim();

    if (!name) {
      return conn.sendMessage(
        m.chat,
        { text: "masukan nama xtal setelah .xtal nama" },
        { quoted: m },
      );
    }

    const { data: dataXtal, error } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", `%${name}%`)
      .limit(20);

    if (error) {
      console.log("ERR XTAL QUERY:", error.message);
      return conn.sendMessage(
        m.chat,
        { text: "terjadi kesalahan saat mengambil data xtal" },
        { quoted: m },
      );
    }

    if (!dataXtal || dataXtal.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "xtal tidak ditemukan" },
        { quoted: m },
      );
    }

    // ✅ kalau cuma 1 → langsung tampil (tanpa query ulang)
    if (dataXtal.length === 1) {
      const item = dataXtal[0];

      const text = `*${item.name}* ${item.type || "-"}
${item.stats || "-"}

rute:
- ${item.upgrade_route || "-"}
- ${item.max_upgrade_route || "-"}`.trim();

      return conn.sendMessage(m.chat, { text }, { quoted: m });
    }

    // ✅ kalau banyak → tampilkan button
    return await conn.sendButton(m.chat, {
      text: `xtal yang tersedia sebanyak ${dataXtal.length}`,
      footer: config.OwnerName,
      buttons: dataXtal.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "daftar xtal",
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
