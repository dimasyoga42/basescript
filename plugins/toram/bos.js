import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const name = arg[1];
    if (!name)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .bosdef name",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    const { data } = await supa
      .from("bosdef")
      .select("name, type, image_url, spawn, element, stat")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (!data)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    const parser = `
      Element:\n${data.element}\nType:${data.type}\n\n Stat Info:\n${data.stat}
      `.trim();
    sendFancyText(conn, m.chat, {
      title: data.name,
      body: `loc: ${data.spawn}`,
      thumbnail: data.image_url,
      text: parser,
      quoted: m,
    });
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

handler.command = ["bosdef"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
