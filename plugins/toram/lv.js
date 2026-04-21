import * as cheerio from "cheerio";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { client } from "../../src/config/redis.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = (m.text || "").trim().split(/\s+/);
    const level = parts[1];

    if (!level || isNaN(level)) {
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}, use: .lv 299`,
        m
      );
    }

    const lvNum = Number(level);
    const cacheKey = `toram:level:${lvNum}`;

    // ─── REDIS CACHE ───────────────────────────────────────
    const cached = await client.get(cacheKey);
    if (cached) {
      return sendText(conn, m.chat, cached, m);
    }

    // ─── DATABASE CHECK ────────────────────────────────────
    const { data: lv, error: dbErr } = await supa
      .from("lvl")
      .select("query, stat")
      .eq("query", lvNum)
      .limit(1)
      .maybeSingle();

    if (dbErr) console.error("[Supabase] select error:", dbErr);

    if (lv && lv.stat) {
      await client.set(cacheKey, lv.stat, { EX: 300 });
      return sendText(conn, m.chat, lv.stat, m);
    }

    // ─── FETCH SCRAPING ────────────────────────────────────
    const res = await fetch(
      `https://coryn.club/leveling.php?lv=${encodeURIComponent(lvNum)}&gap=7&bonusEXP=0`
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let mtext = `Daftar Leveling ${lvNum}`;
    let found = false;

    $("section.level-group").each((_, section) => {
      const title = $(section).find("h2").text().trim();

      if (title !== "Boss" && title !== "Mini Boss") return;

      let sectionText = `\n${title}\n`;

      $(section)
        .find("article.level-entry")
        .each((__, entry) => {
          const lvl = $(entry).find(".level-entry-level").text().trim();
          const name = $(entry)
            .find(".level-entry-main p:first-child b")
            .text()
            .trim();
          const loc = $(entry)
            .find(".level-entry-main p")
            .eq(1)
            .text()
            .trim();

          if (name) {
            found = true;
            sectionText += `- ${name} (${lvl}) -> ${loc}\n`;
          }
        });

      if (sectionText.trim() !== title) {
        mtext += sectionText;
      }
    });

    if (!found) {
      mtext += `\n${config.message.notFound}`;
    }

    // ─── CACHE RESULT ──────────────────────────────────────
    await client.set(cacheKey, mtext, { EX: 300 });

    // ─── INSERT DATABASE (UPSERT SAFE) ─────────────────────
    const { error: insertErr } = await supa
      .from("lvl")
      .upsert(
        { query: lvNum, stat: mtext },
        { onConflict: "query" }
      );

    if (insertErr) console.error("[Supabase] upsert error:", insertErr);

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
