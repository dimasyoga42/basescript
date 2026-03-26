import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
import { formatDetail, parseMonsters } from "./_formater.js";
const BASE_URL = "https://coryn.club";
const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const name = arg[1];
    if (!name)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}, use: .bosdef namebos`,
      );
    const url = `${BASE_URL}/monster.php?name=${encodeURIComponent(name)}&type=&order=id+DESC&show=22`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const utlis = parseMonsters(res);
    const dtail = utlis
      .slice(0, 1)
      .map((mob, i) => formatDetail(mob, i, utlis.length));
    console.log(dtail);
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
      Element:\n${data.element}\nType:${data.type}\n${dtail}\n\n Stat Info:\n${data.stat}
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
