import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

/**
 * Fungsi parseRoute mengekstraksi nama individu dari string rute.
 * Menggunakan regex pada split untuk menangani variasi spasi di sekitar delimiter.
 */
const parseRoute = (route) => {
  if (!route || typeof route !== "string") return [];
  return route
    .split(/\s*->\s*/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
};

/**
 * Fungsi mergeRoutes menggabungkan elemen dari jalur normal dan jalur maksimal.
 * Menggunakan struktur data Set untuk memastikan integritas data unik (deduplikasi).
 */
const mergeRoutes = (normalRoutes, maxRoutes) => {
  return [...new Set([...normalRoutes, ...maxRoutes])];
};

/**
 * Fungsi utama untuk mengirimkan hasil pencarian Xtal.
 * Mengonversi array rute menjadi tombol interaktif (Quick Reply).
 */
const sendXtalResult = (conn, chat, m, item) => {
  const text = `*${item.name}* [${item.type || "-"}]

*Stats:*
${item.stats || "-"}

*Upgrade Path:*
- ${item.upgrade_route || "-"}
- ${item.max_upgrade_route || "-"}`.trim();

  const normalPath = parseRoute(item.upgrade_route);
  const maxPath = parseRoute(item.max_upgrade_route);
  const combinedRoutes = mergeRoutes(normalPath, maxPath);

  // Jika tidak ada data rute, kirim pesan teks biasa
  if (combinedRoutes.length === 0) {
    return conn.sendMessage(chat, { text }, { quoted: m });
  }

  // Transformasi elemen rute menjadi format button WhatsApp
  const buttons = combinedRoutes.map((name) => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: name,
      id: `.xtal ${name}`,
    }),
  }));

  return conn.sendButton(chat, {
    text,
    footer: config.BotName,
    buttons,
    bottom_sheet: true,
    bottom_name: "Detail Rute Evolusi",
  });
};

const handler = async (m, { conn }) => {
  try {
    const query = (m.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "Format salah. Gunakan: .xtal [nama xtal]" },
        { quoted: m },
      );
    }

    // Prosedur pengambilan seluruh daftar nama (Mode --all)
    if (query === "--all") {
      const { data: db, error } = await supa
        .from("xtal")
        .select("name")
        .order("name", { ascending: true });

      if (error || !db?.length) {
        return conn.sendMessage(
          m.chat,
          { text: "Gagal mengambil data dari database." },
          { quoted: m },
        );
      }

      return conn.sendButton(m.chat, {
        text: "Daftar Seluruh Crysta:",
        footer: config.OwnerName,
        buttons: db.slice(0, 20).map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.xtal ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar Xtal",
      });
    }

    // Pencarian dengan metode Exact Match (Kesesuaian Tepat)
    const { data: exact, error: errExact } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", query)
      .limit(1);

    if (!errExact && exact?.length === 1) {
      return sendXtalResult(conn, m.chat, m, exact[0]);
    }

    // Pencarian dengan metode Partial Match (Kesesuaian Sebagian)
    const { data, error } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", `%${query}%`)
      .limit(20);

    if (error || !data?.length) {
      return conn.sendMessage(
        m.chat,
        { text: `Informasi untuk *${query}* tidak ditemukan dalam database.` },
        { quoted: m },
      );
    }

    // Jika hasil pencarian hanya satu, langsung tampilkan detail
    if (data.length === 1) {
      return sendXtalResult(conn, m.chat, m, data[0]);
    }

    // Menampilkan pilihan jika ditemukan beberapa hasil yang relevan
    return conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* hasil yang relevan untuk: _${query}_`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Hasil Pencarian",
    });
  } catch (err) {
    console.error("Internal Server Error (Xtal Handler):", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kegagalan sistem saat memproses permintaan." },
      { quoted: m },
    );
  }
};

handler.command = "xtall";
handler.alias = ["xtal"];
handler.category = "Toram Search";

export default handler;
