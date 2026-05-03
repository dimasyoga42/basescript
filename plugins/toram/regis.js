import { config, thumbnail } from "../../config.js";
import { buildSelectButton, sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      const { data: db, error } = await supa
        .from("regist")
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

    const { data, error } = await supa
      .from("regist")
      .select("*")
      .ilike("name", `%${text}%`);

    if (error) throw error;

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
        `────────────\n*${item.name}*\n\n${item.effect}\n\nMax Level:\n- ${item.max_lv}\nLevel:\n- ${item.levels_studied}\n────────────`,
      );

    // sendText(conn, m.chat, mtext, m);
    await conn.sendButton(m.chat, {
      text: mtext,
      footer: config.OwnerName,
      buttons: [
        buildSelectButton(
          "Neura Sama",
          "Registlet yang tersedia",
          data.map((item) => ({
            title: item.name,
            description: `Lihat Stat dari ${item.name}`,
            id: `.regist ${item.name}`
          }))
        )
      ],
      bottom_sheet: true,
      bottom_name: "Daftar Registlet",
    });

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
handler.alias = ["regist"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
