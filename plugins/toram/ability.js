import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = (m.text || "").trim();
    const parts = text.split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    // LIST SEMUA TRAIT
    if (!query) {
      const { data, error } = await supa
        .from("ablityv2")
        .select("name")
        .order("name", { ascending: true });

      if (error || !data?.length) {
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

    // EXACT MATCH
    const { data: exactData, error: exactError } = await supa
      .from("ablityv2")
      .select("*")
      .ilike("name", query)
      .limit(1);

    if (!exactError && exactData?.length === 1) {
      const item = exactData[0];
      return sendText(conn, m.chat, `${item.name}\n${item.stat_effect}`, m);
    }

    // PARTIAL MATCH
    const { data, error } = await supa
      .from("ablityv2")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true });

    if (error || !data?.length) {
      return sendText(conn, m.chat, "Data trait tidak ditemukan.", m);
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
