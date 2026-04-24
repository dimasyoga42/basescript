import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = (m.text || "").trim();
    const args = text.split(/\s+/);
    const name = args.slice(1).join(" ").trim();

    // ambil semua buff (dipakai untuk list & fallback)
    const { data: allBuff, error: errAll } = await supa
      .from("buff")
      .select("name, code");

    if (errAll) throw errAll;

    if (!name) {
      const mtext = (allBuff || [])
        .map((item) => `\n*${item.name}*\n${item.code}\n`)
        .join("\n────────────\n");

      return await conn.sendButton(m.chat, {
        text: mtext || "Tidak ada data buff",
        footer: config.OwnerName,
        buttons: (allBuff || []).slice(0, 20).map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.buff ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar Buff",
      });
    }

    // search buff berdasarkan nama
    const { data, error } = await supa
      .from("buff")
      .select("name, code")
      .ilike("name", `%${name}%`);

    if (error) throw error;

    if (!data || data.length === 0) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail,
        text: `Buff "${name}" tidak ditemukan`,
        quoted: m,
      });
    }

    const mtext = data
      .map((item) => `\n*${item.name}*\n${item.code}\n`)
      .join("\n────────────\n");

    return await conn.sendButton(m.chat, {
      text: mtext,
      footer: config.OwnerName,
      buttons: data.slice(0, 20).map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.buff ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Hasil Pencarian",
    });
  } catch (err) {
    console.error(err);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["buff"];
handler.category = "Menu Toram";
handler.submenu = "Toram";

export default handler;
