import { config, thumbnail } from "../../config.js";
import {
  buildSelectButton,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn, text }) => {
  try {
    // Ambil semua nama regist sekali di awal (untuk button list)
    const { data: allData, error: allError } = await supa
      .from("regist")
      .select("name")
      .order("name", { ascending: true });

    if (allError || !allData?.length) {
      return conn.sendMessage(
        m.chat,
        { text: "Gagal mengambil data dari database." },
        { quoted: m },
      );
    }

    if (!text) {
      return conn.sendButton(m.chat, {
        text: "Daftar Seluruh regist\n- gunakan .regis [nama regis yang dicari]",
        footer: config.OwnerName,
        buttons: allData.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.regist ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar Regist",
      });
    }

    const { data, error } = await supa
      .from("regist")
      .select("*")
      .ilike("name", `%${text}%`);

    if (error) throw error;

    if (!data || data.length === 0) {
      return sendText(
        conn,
        m.chat,
        `pencarian untuk ${text} tidak ditemukan, atau ada kesalahan pada sistem`,
        m,
      );
    }

    const mtext = data
      .map(
        (item) =>
          `*${item.name}*\nDeskripsi:\n${item.effect}\n\nMax Level:\n- ${item.max_lv}\nLevel:\n- ${item.levels_studied}\n`,
      )
      .join("\n");

    await sendText(conn, m.chat, mtext, m);
  } catch (err) {
    console.error("[regis] Error:", err);
    sendText(conn, m.chat, "terjadi kesalahan pada server harap di ulang", m);
  }
};

handler.command = "regis";
handler.alias = ["regist"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
