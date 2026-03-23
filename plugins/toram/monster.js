import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.split(" ").slice(1).join(" ").trim();
    if (!name)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}, use: .mob nameMobs`,
      );

    const { data } = await supa
      .from("monster_v2")
      .select(
        "Name, Level, Type, Mode, HP, Element, EXP, Tamable, Location, Drops ",
      )
      .ilike("Name", `%${name}%`);

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
          `*${item.Name}*\nLevel: ${item.Level}\nType: ${item.Type}\nTamable: ${item.Tamable}\nElement: ${item.Element}\nHP: ${item.HP}\nEXP: ${item.EXP}\nMap: ${item.Location}\nDrops:\n- ${item.Drops}`,
      )
      .join("\n\n");

    sendText(conn, m.chat, mtext, m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = "mob";
handler.alias = ["mobs"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
