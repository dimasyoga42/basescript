import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";

const TRAIT_API_URL = "https://server.neurasama.my.id/etc/toram/trait";

const fetchTraitData = async (name) => {
  try {
    const url = name
      ? `${TRAIT_API_URL}?name=${encodeURIComponent(name)}`
      : TRAIT_API_URL;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Request gagal dengan status ${res.status}`);
    }
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    console.error("[ability] fetchTraitData error:", err);
    throw err;
  }
};

const handler = async (m, { conn }) => {
  try {
    const text = (m.text || "").trim();
    const parts = text.split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    // LIST SEMUA TRAIT
    if (!query) {
      let data;
      try {
        data = await fetchTraitData();
      } catch (err) {
        return sendText(conn, m.chat, "Gagal mengambil daftar ability.", m);
      }
      if (!data?.length) {
        return sendText(conn, m.chat, "Gagal mengambil daftar ability.", m);
      }
      return await conn.sendButton(m.chat, {
        text: "format salah gunakan .trait mega",
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "Daftar Trait",
            "Silahkan pilih salah satu",
            data.map((item) => ({
              title: item.name,
              description: `Lihat Stat dari ${item.name}`,
              id: `.trait ${item.name}`,
            })),
          ),
        ],
        bottom_sheet: true,
        bottom_name: "Menu Ability",
      });
    }

    // CARI BERDASARKAN QUERY
    let data;
    try {
      data = await fetchTraitData(query);
    } catch (err) {
      return sendText(
        conn,
        m.chat,
        "Terjadi kesalahan saat mengambil data pada server.",
        m,
      );
    }

    if (!data?.length) {
      return sendText(conn, m.chat, "Data trait tidak ditemukan.", m);
    }

    // EXACT MATCH
    const exactMatches = data.filter(
      (item) => item?.name?.toLowerCase() === query.toLowerCase(),
    );
    if (exactMatches.length === 1) {
      const item = exactMatches[0];
      return sendText(conn, m.chat, `${item.name}\n${item.stat_effect}`, m);
    }

    // JIKA CUMA 1 HASIL
    if (data.length === 1) {
      const item = data[0];
      return sendText(conn, m.chat, `${item.name}\n${item.stat_effect}`, m);
    }

    // MULTI RESULT
    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* ability untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: [
        buildSelectButton(
          "Daftar Trait",
          "Silahkan pilih salah satu",
          data.map((item) => ({
            title: item.name,
            description: `Lihat Stat dari ${item.name}`,
            id: `.trait ${item.name}`,
          })),
        ),
      ],
      bottom_sheet: true,
      bottom_name: "Menu Ability",
    });
  } catch (err) {
    console.error("[ability]", err);
    await sendText(
      conn,
      m.chat,
      "Terjadi kesalahan saat mengambil data pada server.",
      m,
    );
  }
};
handler.command = "trait";
handler.alias = ["ability"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
