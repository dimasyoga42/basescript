//import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { config, thumbnail } from "../../config.js";
import { sendText } from "../../src/config/message.js";

const BASE_URL = "https://id.toram.jp";

const scrapeBoostBoss = async () => {
  const listRes = await fetch(`${BASE_URL}/top/?type_code=event`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);

  const $ = cheerio.load(await listRes.text());
  const boostNews = [];

  $("ul li a[href*='information_id']").each((_, el) => {
    const fullText = $(el).text().trim();
    if (!fullText.toLowerCase().includes("boost")) return;

    const dateMatch = fullText.match(/［(\d{4}-\d{2}-\d{2})］/);
    const dateStr = dateMatch ? dateMatch[1] : "";
    const parts = dateStr.split("-");

    boostNews.push({
      title: fullText.replace(/［\d{4}-\d{2}-\d{2}］/, "").trim(),
      href: $(el).attr("href").startsWith("http")
        ? $(el).attr("href")
        : BASE_URL + $(el).attr("href"),
      parsedDate: dateStr ? new Date(parts[0], parts[1] - 1, parts[2]) : null,
    });
  });

  if (boostNews.length === 0)
    return { active: false, bosses: [], message: "No boost event found" };

  const latest = boostNews.reduce((a, b) =>
    b.parsedDate && a.parsedDate && b.parsedDate > a.parsedDate ? b : a,
  );

  const detailRes = await fetch(latest.href, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);

  const $d = cheerio.load(await detailRes.text());
  const bodyText = $d("body").text();

  let eventEndDate = null;
  let readableEndString = "";

  const idMatch = bodyText.match(
    /(?:Selesai|Berakhir)\s*[:]\s*[^,]*,?\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})\s+(?:pukul|jam)\s*(\d{1,2})[:\.](\d{2})\s*WIB/i,
  );

  if (idMatch) {
    const [, d, monthName, y, h, min] = idMatch;
    const monthMap = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11,
    };
    const month = monthMap[monthName.toLowerCase()];
    if (month !== undefined) {
      eventEndDate = new Date(Date.UTC(+y, month, +d, +h, +min) - 7 * 3600000);
      readableEndString = `${d} ${monthName} ${y} ${h}:${min.padStart(2, "0")} WIB`;
    }
  } else {
    const enMatch = bodyText.match(
      /Until:\s*([A-Za-z]+)\s+(\d+)[a-z]{2}\s+at\s+(\d{1,2}):(\d{2})\s+(AM|PM)\s+\(JST/i,
    );
    if (enMatch) {
      const [, monthName, day, , min, ampm] = enMatch;
      let h = parseInt(enMatch[3]);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      const monthMap = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
      };
      const month = monthMap[monthName.toLowerCase()];
      if (month !== undefined) {
        const y = new Date().getFullYear();
        const wib = new Date(
          Date.UTC(y, month, +day, h, +min) - 9 * 3600000 - 2 * 3600000,
        );
        eventEndDate = wib;
        readableEndString = `${wib.getDate()} ${monthName} ${y} ${wib.getHours()}:${wib.getMinutes().toString().padStart(2, "0")} WIB`;
      }
    }
  }

  if (eventEndDate && new Date() > eventEndDate)
    return { active: false, expired: true, lastDate: readableEndString };

  const bosses = [];
  $d(".subtitle").each((_, el) => {
    const text = $d(el).text().trim();
    if (!text.match(/^Lv\d+\s+/)) return;

    const match = text.match(/^(Lv\d+)\s+([^(]+)(?:\(([^)]+)\))?/);
    if (!match) return;

    const [, level, name, location = ""] = match;
    let img = null;
    let next = $d(el).next();

    for (let i = 0; i < 3; i++) {
      if (!next.length) break;
      const found = next.find("img");
      if (found.length) {
        img = found.first().attr("src");
        break;
      }
      next = next.next();
    }

    if (!img) return;

    const imageUrl = img.startsWith("http")
      ? img
      : img.startsWith("//")
        ? "https:" + img
        : img.startsWith("/")
          ? "https://toram-jp.akamaized.net" + img
          : "https://toram-jp.akamaized.net/img/announcement/bossevent/" +
            img.replace(/^\.\/.*\//, "");

    bosses.push({
      level,
      name: name.trim(),
      location,
      fullName: `${level} ${name.trim()}${location ? ` (${location})` : ""}`,
      image: imageUrl,
    });
  });

  return {
    active: true,
    bosses,
    endDateStr: readableEndString,
    eventTitle: latest.title,
  };
};

const handler = async (m, { conn }) => {
  try {
    const data = await scrapeBoostBoss();

    if (!data.active) {
      const text = data.expired
        ? `Boost Boss event ended:\n${data.lastDate}`
        : "No active Boost Boss event";
      return sendText(conn, m.chat, text, m);
    }

    if (!data.bosses?.length)
      return sendText(
        conn,
        m.chat,
        `Event active: ${data.eventTitle}\n\nFailed to get boss list`,
        m,
      );

    await sendText(
      conn,
      m.chat,
      `*BOOST BOSS*\nEnds: ${data.endDateStr || "-"}`,
      m,
    );

    for (const boss of data.bosses) {
      try {
        await conn.sendMessage(
          m.chat,
          boss.image
            ? { image: { url: boss.image }, caption: boss.fullName }
            : { text: boss.fullName },
          { quoted: m },
        );
        await new Promise((r) => setTimeout(r, 700));
      } catch {
        await sendText(conn, m.chat, boss.fullName, m);
      }
    }
  } catch (err) {
    console.error("[bosboost]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["bosboost"];
handler.category = "Menu Toram";
handler.submenu = "Toram";
export default handler;
