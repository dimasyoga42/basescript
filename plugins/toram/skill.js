import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.skill\s*/i, "").trim();

    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exempel: .skill Hard Hit",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

    const { data, error } = await supa
      .from("skill")
      .select(
        "Skill Tree, Nama Skill, Type, MP Cost, Element, Deskripsi, Deskripsi_Indo",
      )
      .ilike("Nama Skill", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    if (data.length === 1) {
      const item = data[0];
      const text = `⚔️ *${item["Nama Skill"]}*
${"─".repeat(20)}
Tree    : ${item["Skill Tree"] || "-"}
Type    : ${item["Type"] || "-"}
MP Cost : ${item["MP Cost"] || "-"}
Element : ${item["Element"] || "-"}

*Deskripsi:*
${item["Deskripsi"] || "-"}

*Terjemahan:*
${item["Deskripsi_Indo"] || "-"}`;

      return sendText(conn, m.chat, text, m);
    }

    const mtext =
      `*Hasil: ${query}*\n${"─".repeat(20)}\n\n` +
      data
        .map(
          (item, i) =>
            `*${i + 1}.* ${item["Nama Skill"]} (${item["Skill Tree"] || "-"})`,
        )
        .join("\n") +
      `\n\n> Pilih salah satu:`;

    await sendText(conn, m.chat, mtext, m);
    await conn.sendButton(m.chat, {
      caption: `Ditemukan ${data.length} skill untuk: *${query}*`,
      image: { url: thumbnail },
      footer: config.OwnerName,
      buttons: data.slice(0, 10).map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: `${item["Nama Skill"]}`,
          id: `.skill ${item["Nama Skill"]}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Pilih Skill",
    });
  } catch (err) {
    console.error("[skill]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["skill"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
