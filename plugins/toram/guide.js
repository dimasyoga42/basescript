import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = m.text.trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();
    if (!query) {
      const { data, error } = await supa
        .from("perpus")
        .select("id, judulPerpus")
        .order("id");

      if (error || !data || data.length === 0)
        return sendText(conn, m.chat, config.message.notFound, m);

      await conn.sendButton(m.chat, {
        text: `Pilih guide untuk membaca:`,
        footer: config.OwnerName,
        buttons: data.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: `${item.judulPerpus}`,
            id: `.guide ${item.judulPerpus}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Pilih Guide",
      });

      return;
    }

    const { data, error } = await supa
      .from("perpus")
      .select("id, judulPerpus, isiBuku, buku_en")
      .ilike("judulPerpus", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    if (data.length === 1) {
      const item = data[0];
      return sendText(
        conn,
        m.chat,
        `*${item.judulPerpus}*\n${"─".repeat(20)}\n\n` +
          `*Indonesia:*\n${item.isiBuku || "-"}\n\n` +
          `*English:*\n${item.buku_en || "-"}`,
        m,
      );
    }

    await conn.sendButton(m.chat, {
      caption:
        `*Hasil: ${query}*\n${"─".repeat(20)}\n` +
        `Ditemukan ${data.length} guide\n\nPilih untuk membaca:`,
      image: { url: thumbnail },
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: `${item.judulPerpus}`,
          id: `.guide ${item.judulPerpus}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Pilih Guide",
    });
  } catch (err) {
    console.error("[guide]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["guide"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
