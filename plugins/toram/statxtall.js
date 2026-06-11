import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text ?? "";
    const query = text.replace(/^\.statsxtal\s*/i, "").trim();

    if (!query) {
      return sendText(
        conn,
        m.chat,
        "masukan stat xtal yang ingin anda cari setelah cmd",
        m,
      );
    }

    const { data, error } = await supa
      .from("xtal")
      .select("name, stats")
      .ilike("stats", `%${query}%`)
      .limit(20);

    if (error) {
      console.error("ERR STATS XTAL:", error.message);
      return sendText(conn, m.chat, "terjadi kesalahan saat mengambil data", m);
    }

    if (!data?.length) {
      return sendText(conn, m.chat, "stat yang dicari tidak ditemukan", m);
    }

    if (data.length === 1) {
      return sendText(conn, m.chat, `.xtal ${data[0].name}`, m);
    }

    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* xtal dengan stat _${query}_

Pilih salah satu:`,

      footer: config.OwnerName,

      buttons: [
        buildSelectButton(
          "List Xtal",
          "Silahkan pilih xtal",
          data.map((item) => {
            const matchedStat =
              item.stats
                ?.split("|")
                .map((s) => s.trim())
                .find((s) => s.toLowerCase().includes(query.toLowerCase())) ??
              "Tidak ada stat";

            return {
              title: item.name,
              description: matchedStat.slice(0, 72),
              id: `.xtal ${item.name}`,
            };
          }),
        ),
      ],

      bottom_sheet: true,
      bottom_name: "List Xtal",
    });
  } catch (err) {
    console.error("ERR STATS XTAL:", err);
    await sendText(conn, m.chat, "terjadi error tidak terduga", m);
  }
};

handler.command = "statsxtal";
handler.category = "Toram Search";

export default handler;
