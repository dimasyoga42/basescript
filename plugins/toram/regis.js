import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn, text }) => {
  try {
    // Gunakan `text` dari runCommand, lebih bersih dari split manual
    if (!text) {
      const { data: db, error } = await supa
        .from("regist")
        .select("name")
        .order("name", { ascending: true });

      if (error || !db?.length) {
        return conn.sendMessage(
          m.chat,
          { text: "Gagal mengambil data dari database." },
          { quoted: m }
        );
      }

      return conn.sendButton(m.chat, {
        text: "Daftar Seluruh regist\n- gunakan .regis [nama regis yang dicari]",
        footer: config.OwnerName,
        buttons: db.map((item) => ({
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

    // ✅ Destructure { data, error } dari response Supabase
    const { data, error } = await supa
      .from("regist")
      .select("*")
      .ilike("name", `%${text}%`);

    // ✅ Cek error Supabase
    if (error) throw error;

    // ✅ Pakai `data` (bukan `res`)
    if (!data || data.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });

    const mtext = data
      .map(
        (item) =>
          `${item.name}\n${item.effect}\nMax Level:\n- ${item.max_lv}\nLevel Studied:\n- ${item.levels_studied}`,
      )
      .join("\n────────────\n");

    sendText(conn, m.chat, mtext, m);
  } catch (err) {
    console.error("[regis] Error:", err);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = "regis";
handler.alias = ["regist"]
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
