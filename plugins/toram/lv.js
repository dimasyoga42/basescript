import * as cheerio from "cheerio";
import { sendFancyText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
//import fetch from "node-fetch";
const handler = async (m, { conn }) => {
  try {
    const level = m.text.trim().split(/\s+/)[1];
    if (!level || isNaN(level))
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `exemple: .lv 299`,
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    const res = await fetch(
      `https://coryn.club/leveling.php?lv=${encodeURIComponent(level)}&gap=7&bonusEXP=0`,
    );
    if (!res.ok) throw new Error(`HTTPS ${res.status}`);
    const $ = cheerio.load(await res.text());
    let mtext = `Daftar Leveling ${level}`;
    let found = false;
    $("section.level-group").each((_, section) => {
      const title = $(section).find("h2").text().trim();
      if (title !== "Boss" && title !== "Mini Boss") return;

      mtext += `\n${title}\n`;

      $(section)
        .find("article.level-entry")
        .each((__, entry) => {
          const level = $(entry).find(".level-entry-level").text().trim();
          const name = $(entry)
            .find(".level-entry-main p:first-child b")
            .text()
            .trim();
          const loc = $(entry).find(".level-entry-main p").eq(1).text().trim();
          const exp = $(entry).find(".level-entry-exp p").first().text().trim();

          if (name && exp) {
            found = true;
            mtext += `- ${name}(${level}) -> ${loc}\n`;
          }
        });
    });
    if (!found) return (mtext += config.message.notFound);

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: mtext,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};
handler.command = ["level"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
