import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/\.ststxtal/, "").trim();
    if (!query)
      return conn.sendMessage(
        m.chat,
        { text: "masukan stat xtall yang ingin anda cari setelah cmd" },
        { quoted: m },
      );
    const { ex: exstst, err } = await supa
      .from("xtal")
      .select("name, stats")
      .ilike("stats", `%${query}%`);
    if (!exstst | err)
      return conn.sendMessage(
        m.chat,
        { text: "stat yang di cari tidak ada" },
        { quoted: m },
      );
    return await conn.sendButton(m.chat, {
      text: `xtal yang tersedia sebanyak ${exstst.length}`,
      footer: config.OwnerName,
      buttons: exstst.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "xtal",
    });
  } catch (err) {
    return console.log(err);
  }
};
handler.command = "statsxtal";
handler.category = "Toram Search";
export default handler;
