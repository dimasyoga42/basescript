import * as cheerio from "cheerio";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { client } from "../../src/config/redis.js";

const handler = async (m, { conn }) => {
  try {
    const level = m.text.trim().split(/\s+/)[1];

    if (!level || isNaN(level)) {
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}, use: .lv 299`,
        m,
      );
    }

    const cacheKey = `toram:level:${level}`;

    // ─── GET CACHE FIRST ─────────────────────────────────────
    const cached = await client.get(cacheKey);
    if (cached) {
      return sendText(conn, m.chat, cached, m);
    }

    // ─── FETCH DATA ──────────────────────────────────────────
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
          const lvl = $(entry).find(".level-entry-level").text().trim();

          const name = $(entry)
            .find(".level-entry-main p:first-child b")
            .text()
            .trim();

          const loc = $(entry).find(".level-entry-main p").eq(1).text().trim();

          if (name) {
            found = true;
            mtext += `- ${name} (${lvl}) -> ${loc}\n`;
          }
        });
    });

    if (!found) {
      mtext += config.message.notFound;
    }

    // ─── SAVE CACHE (TTL 5 menit) ────────────────────────────
    await client.set(cacheKey, mtext, {
      EX: 300,
    });

    return sendText(conn, m.chat, mtext, m);
  } catch (err) {
    console.error(err);

    return sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = "lv";
handler.alias = ["level", "lvl"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
