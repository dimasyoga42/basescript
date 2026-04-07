import { thumbnail } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text.replace(/\.boss|\.bos/i, "").trim();
    if (!text)
      return conn.sendMessage(
        m.chat,
        { text: "Contoh: .boss scrader" },
        { quoted: m },
      );
    if (text === "--all") {
      const { data: db, err } = await supa.from("bosv22").select("name");
      return await conn.sendButton(m.chat, {
        image: thumbnail, // ❗ jangan pakai { url: thumbnail }
        caption: "Boss yang tersedia" + db.length,
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.boss ${item.name}`,
          }),
        })),
        bottom_sheet: true, //kalau mau button dalam button
        bottom_name: "boss name",
      });
    }

    const { data, error } = await supa
      .from("bosv22")
      .select("name, element, location, drop, range")
      .ilike("name", `%${text}%`)
      .limit(1);

    if (error) throw error;
    if (!data?.length)
      return conn.sendMessage(
        m.chat,
        { text: `Boss "${text}" tidak ditemukan.` },
        { quoted: m },
      );

    const { name, element, location, drop, range } = data[0];

    const stats = Object.entries(range)
      .map(
        ([diff, s]) =>
          `*${diff}* (Lv ${s.lv})\n` +
          `   HP: ${s.hp.toLocaleString("id-ID")}\n` +
          `   EXP: ${s.exp.toLocaleString("id-ID")}\n` +
          `   Leveling: ${s.leveling}`,
      )
      .join("\n\n");

    const drops = drop
      .split(",")
      .map((d) => `- ${d.trim()}`)
      .join("\n");

    const mtext =
      `*${name}*\n` +
      `Elemen: ${element}\n` +
      `Lokasi: ${location}\n\n` +
      `*Stats*\n${stats}\n\n` +
      `*Drop*\n${drops}`;

    await conn.sendMessage(m.chat, { text: mtext }, { quoted: m });
  } catch (err) {
    console.error("[boss]", err);
  }
};

handler.command = "bos";
handler.alias = ["boss"];
handler.category = "Toram Search";
export default handler;
