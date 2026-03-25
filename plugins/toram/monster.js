import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const BASE_URL = "https://coryn.club";

const parseMonsters = (html) => {
  const $ = cheerio.load(html);
  const monsters = [];

  $(".card-container.monster-list-grid > div").each((_, card) => {
    const $card = $(card);
    const $nameLink = $card.find(".card-title-inverse a").first();
    const name = $nameLink.text().trim();

    const stats = {};
    $card.find(".item-prop.col-2 > div").each((_, el) => {
      const label = $(el).find("p.accent-bold").text().trim().toLowerCase();
      const value = $(el).find("p").last().text().trim();
      if (label) stats[label] = value;
    });

    const spawn = $card.find(".item-prop").not(".col-2").first().find("a").first().text().trim();

    const drops = [];
    $card.find(".monster-drop").each((_, el) => {
      const itemName = $(el).find("a").first().text().trim();
      const cat = $(el).find("div").first().text().trim().match(/^\[([^\]]+)\]/)?.[1] || "Item";
      if (itemName) drops.push(`[${cat}] ${itemName}`);
    });

    if (name) monsters.push({ name, stats, spawn, drops });
  });

  return monsters;
};

const formatDetail = (mob, i, total) => {
  const s = mob.stats;
  return (
    `*${mob.name}* ${total > 1 ? `(${i + 1}/${total})` : ""}\n${"─".repeat(20)}\n` +
    `Lv     : ${s.lv || "-"}\n` +
    `Type   : ${s.type || "-"}\n` +
    `Mode   : ${s.mode || "-"}\n` +
    `HP     : ${s.hp || "-"}\n` +
    `Elemen : ${s.element || "-"}\n` +
    `EXP    : ${s.exp || "-"}\n` +
    `Tamable: ${s.tamable || "-"}\n` +
    `Spawn  : ${mob.spawn || "-"}\n\n` +
    `*Drop:*\n${mob.drops.join("\n") || "-"}`
  );
};

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.mobs\s*/i, "").trim();

    if (!query)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "Contoh: .mobs gordel",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

    await sendText(conn, m.chat, "Mencari...", m);

    const url = `${BASE_URL}/monster.php?name=${encodeURIComponent(query)}&type=&order=id+DESC&show=22`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const monsters = parseMonsters(await res.text());

    if (!monsters.length)
      return sendText(conn, m.chat, config.message.notFound, m);

    // ✅ Langsung tampilkan semua data sekaligus
    const result = monsters
      .map((mob, i) => formatDetail(mob, i, monsters.length))
      .join("\n\n" + "═".repeat(20) + "\n\n");

    await sendText(conn, m.chat,
      `*Hasil: ${query}* — ${monsters.length} monster\n\n${result}`,
      m
    );
  } catch (err) {
    console.error("[monster]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["mobs"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
