import { config, thumbnail } from "../../config.js"; // ✅ tambah config
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text.replace(/\.boss|\.bos/i, "").trim();
    if (!text) {
      const { data: db, error: dbError } = await supa
        .from("bosv22")
        .select("name");

      // ✅ Cek error dan null sebelum akses db.length / db.map
      if (dbError || !db)
        return conn.sendMessage(
          m.chat,
          { text: "Gagal mengambil data boss." },
          { quoted: m },
        );

      return await conn.sendButton(m.chat, {
        text: "Boss yang tersedia: " + db.length, // ✅ tambah spasi sebelum angka
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.boss ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "daftar Bos",
      });
    }

    const { data, error } = await supa
      .from("bosv22")
      .select("name, element, location, drop, range")
      .ilike("name", `%${text}%`)
      .limit(1);

    if (error) throw error;
    if (!data?.length)
      return conn.sendMessage(
        m.chat,
        { text: `Boss "${text}" tidak ditemukan.` },
        { quoted: m },
      );

    const { name, element, location, drop, range } = data[0];

    // ✅ Pastikan range adalah object sebelum Object.entries()
    const rangeObj =
      typeof range === "string" ? JSON.parse(range) : (range ?? {});
    const stats =
      Object.keys(rangeObj).length > 0
        ? Object.entries(rangeObj)
            .map(
              ([diff, s]) =>
                `*${diff}* (Lv ${s.lv})\n` +
                `   HP: ${s.hp.toLocaleString("id-ID")}\n` +
                `   EXP: ${s.exp.toLocaleString("id-ID")}\n` +
                `   Leveling: ${s.leveling}`,
            )
            .join("\n\n")
        : "Tidak ada data stat.";

    // ✅ Pastikan drop tidak null sebelum .split()
    const drops = drop
      ? drop
          .split(",")
          .map((d) => `- ${d.trim()}`)
          .join("\n")
      : "Tidak ada data drop.";

    const mtext =
      `*${name}*\n` +
      `Elemen: ${element}\n` +
      `Lokasi: ${location}\n\n` +
      `*Stats*\n${stats}\n\n` +
      `*Drop*\n${drops}`;

    await conn.sendMessage(m.chat, { text: mtext }, { quoted: m });
  } catch (err) {
    console.error("[boss]", err);
    // ✅ Opsional: kasih feedback ke user kalau error
    conn.sendMessage(m.chat, { text: "Terjadi kesalahan." }, { quoted: m });
  }
};

handler.command = "bos";
handler.alias = ["boss"];
handler.category = "Toram Search";
export default handler;
