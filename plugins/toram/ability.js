import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    // ✅ Fix regex — hapus prefix .trait atau .ability beserta spasi
    const query = m.text.replace(/^\.(trait|ability)\s*/i, "").trim();

    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "Contoh: .ability nama",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

    const { data, error } = await supa
      .from("ability")
      .select("*")
      .ilike("name", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    // ✅ 1 hasil → detail langsung via sendText
    if (data.length === 1) {
      const item = data[0];
      return sendText(conn, m.chat, `*${item.name}*\n\n${item.stat_effect}`, m);
    }

    // ✅ Banyak hasil → list + button
    const mtext =
      `*Hasil: ${query}*\n${"─".repeat(20)}\n\n` +
      data.map((item, i) => `*${i + 1}.* ${item.name}`).join("\n") +
      `\n\n> Pilih salah satu:`;

    await sendText(conn, m.chat, mtext, m);

    await conn.sendButton(m.chat, {
      caption: `Pilih ability untuk melihat detail:`,
      image: { url: thumbnail },
      footer: config.OwnerName,
      buttons: data.slice(0, 10).map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: `${item.name}`,
          id: `.trait ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Pilih Ability",
    });
  } catch (err) {
    console.error("[ability]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = "trait";
handler.alias = ["ability"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
