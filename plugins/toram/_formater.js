import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const BASE_URL = "https://coryn.club";

export const parseMonsters = (html) => {
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

    const spawn = $card
      .find(".item-prop")
      .not(".col-2")
      .first()
      .find("a")
      .first()
      .text()
      .trim();

    const drops = [];
    $card.find(".monster-drop").each((_, el) => {
      const itemName = $(el).find("a").first().text().trim();
      const cat =
        $(el)
          .find("div")
          .first()
          .text()
          .trim()
          .match(/^\[([^\]]+)\]/)?.[1] || "Item";
      if (itemName) drops.push(`[${cat}] ${itemName}`);
    });

    if (name) monsters.push({ name, stats, spawn, drops });
  });

  return monsters;
};

export const formatDetail = (mob, i, total) => {
  const s = mob.stats;
  return `*Drop:*\n- ${mob.drops.join("\n- ") || "-"}`;
};
