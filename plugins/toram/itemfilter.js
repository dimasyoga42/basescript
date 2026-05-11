import { config } from "../../config.js";
import {
  buildSelectButton,
  editText,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const STAT_PATTERNS = [
  {
    aliases: ["atk", "attack", "atk%", "attack%", "atk %"],
    patterns: ["ATK %", "Weapon ATK %", "ATK"],
  },

  {
    aliases: ["matk", "magic atk", "magic attack", "m atk"],
    patterns: ["MATK %", "MATK"],
  },

  {
    aliases: ["cr", "crt", "critical", "critical rate", "crit rate"],
    patterns: ["Critical Rate", "Critical Rate %"],
  },

  {
    aliases: ["cd", "critical damage", "crit damage", "c dmg", "cdmg"],
    patterns: ["Critical Damage", "Critical Damage %"],
  },

  {
    aliases: ["hp", "maxhp", "max hp"],
    patterns: ["MaxHP", "MaxHP %"],
  },

  {
    aliases: ["mp", "maxmp", "max mp"],
    patterns: ["MaxMP", "MaxMP %"],
  },

  {
    aliases: ["ampr", "attack mp recovery", "mp recovery"],
    patterns: ["Attack MP Recovery"],
  },

  {
    aliases: ["aspd", "attack speed"],
    patterns: ["ASPD", "ASPD %"],
  },

  {
    aliases: ["cspd", "cast speed"],
    patterns: ["CSPD", "CSPD %"],
  },

  {
    aliases: ["pp", "physical pierce", "phys pierce", "pierce"],
    patterns: ["Physical Pierce %"],
  },

  {
    aliases: ["mpierce", "magic pierce"],
    patterns: ["Magic Pierce %"],
  },

  {
    aliases: ["srd", "short range", "short range damage"],
    patterns: ["Short Range Damage %"],
  },

  {
    aliases: ["lrd", "long range", "long range damage"],
    patterns: ["Long Range Damage %"],
  },

  {
    aliases: ["pres", "physical resistance"],
    patterns: ["Physical Resistance %"],
  },

  {
    aliases: ["mres", "magic resistance"],
    patterns: ["Magic Resistance %"],
  },

  {
    aliases: ["aggro"],
    patterns: ["Aggro %"],
  },

  {
    aliases: ["stability", "stab"],
    patterns: ["Base Stability %", "Stability %"],
  },

  {
    aliases: ["watk", "weapon atk", "base atk"],
    patterns: ["Base ATK"],
  },

  {
    aliases: ["def", "base def"],
    patterns: ["Base DEF", "DEF %"],
  },
];

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[()%:+\-_/.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveStatPatterns = (keyword) => {
  const normalized = normalizeText(keyword);

  for (const stat of STAT_PATTERNS) {
    const matched = stat.aliases.some((alias) =>
      normalized.includes(normalizeText(alias)),
    );

    if (matched) {
      return stat.patterns;
    }
  }

  return [keyword];
};

const parseCompareQuery = (query) => {
  const operators = [">=", "<=", ">", "<", "="];

  for (const op of operators) {
    const escapedOp = op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(
      `(.+?)\\s*${escapedOp}\\s*(-?\\d+(?:\\.\\d+)?)`,
      "i",
    );

    const match = query.match(regex);

    if (!match) continue;

    const statName = match[1].trim().replace(/\s+/g, " ");

    const compareValue = Number(match[2]);

    if (!statName || Number.isNaN(compareValue)) {
      return null;
    }

    return {
      operator: op,
      statName,
      compareValue,
    };
  }

  return null;
};

const formatStats = (stats = "") =>
  stats
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && !/^amount$/i.test(s))
    .join("\n");

const extractStatValue = (effects, keyword) => {
  if (!effects) return null;

  const patterns = resolveStatPatterns(keyword);

  const stats = effects
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stat of stats) {
    const normalizedStat = normalizeText(stat);

    const matched = patterns.some((pattern) =>
      normalizedStat.includes(normalizeText(pattern)),
    );

    if (!matched) {
      continue;
    }

    const numberMatch = stat.match(/([+-]?\d+(?:\.\d+)?)/);

    if (!numberMatch) {
      continue;
    }

    return Number(numberMatch[1]);
  }

  return null;
};

const getMatchedStat = (effects, keyword) => {
  if (!effects) return "Stat tidak ditemukan";

  const patterns = resolveStatPatterns(keyword);

  const found = effects
    .split("|")
    .map((s) => s.trim())
    .find((stat) => {
      const normalizedStat = normalizeText(stat);

      return patterns.some((pattern) =>
        normalizedStat.includes(normalizeText(pattern)),
      );
    });

  return found || "Stat tidak ditemukan";
};

const formatItem = (item) =>
  `
*${item.ItemName}*
${item.Category || "-"}

${formatStats(item.Effects)}

proses:
- ${item.Process || "-"}
- ${item.Duration || "-"}
- ${item.ObtainedFrom || "-"}
`.trim();

const handler = async (m, { conn }) => {
  try {
    const text = m.text || "";

    let query = text.replace(/^\.itemfilter\s*/i, "").trim();

    if (!query) {
      return sendText(
        conn,
        m.chat,
        `Contoh:
.itemfilter atk
.itemfilter atk>10 --ohs
.itemfilter cr>=30
.itemfilter cd<=20 --add
.itemfilter ampr>20
.itemfilter srd>=10
.itemfilter watk>300

Category:
--ohs
--bwg
--hb
--ths
--staff
--knuck
--bow
--dagger
--arrow
--add
--ring`,
        m,
      );
    }

    let categoryFilter = null;

    const categories = {
      "--add": "Additional",
      "--ohs": "1 Handed Sword",
      "--ths": "2 Handed Sword",
      "--bow": "Bow",
      "--bwg": "Bowgun",
      "--hb": "Halberd",
      "--staff": "Staff",
      "--knuck": "Knuckles",
      "--dagger": "Dagger",
      "--arrow": "Arrow",
      "--ring": "Special",
    };

    for (const [flag, category] of Object.entries(categories)) {
      if (query.toLowerCase().includes(flag)) {
        categoryFilter = category;

        query = query.replaceAll(flag, "").trim();
      }
    }

    let operator = null;
    let statName = null;
    let compareValue = null;

    const parsedCompare = parseCompareQuery(query);

    if (parsedCompare) {
      operator = parsedCompare.operator;

      statName = parsedCompare.statName;

      compareValue = parsedCompare.compareValue;
    }

    let db = supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom");

    if (operator && statName) {
      const patterns = resolveStatPatterns(statName);

      db = db.or(
        patterns.map((pattern) => `Effects.ilike.%${pattern}%`).join(","),
      );
    } else {
      db = db.ilike("Effects", `%${query}%`);
    }

    if (categoryFilter) {
      db = db.eq("Category", categoryFilter);
    }

    const { data, error } = await db;

    if (error) {
      console.log("ERR ITEM FILTER:", error.message);

      return sendText(conn, m.chat, "terjadi kesalahan saat mengambil data", m);
    }

    if (!data || data.length === 0) {
      return sendText(
        conn,
        m.chat,
        "item dengan stat tersebut tidak ditemukan",
        m,
      );
    }

    let filteredData = data;

    if (operator && statName) {
      filteredData = data.filter((item) => {
        const value = extractStatValue(item.Effects, statName);

        if (value === null) {
          return false;
        }

        if (operator === ">") {
          return value > compareValue;
        }

        if (operator === "<") {
          return value < compareValue;
        }

        if (operator === ">=") {
          return value >= compareValue;
        }

        if (operator === "<=") {
          return value <= compareValue;
        }

        if (operator === "=") {
          return value === compareValue;
        }

        return false;
      });
    }

    if (!filteredData.length) {
      return sendText(
        conn,
        m.chat,
        "tidak ada item yang cocok dengan operator perbandingan",
        m,
      );
    }

    if (filteredData.length === 1) {
      return sendFancyText(conn, m.chat, formatItem(filteredData[0]), m);
    }

    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${filteredData.length}* item untuk query _${query}_${
        categoryFilter ? ` (${categoryFilter})` : ""
      }

Pilih salah satu item:`,

      footer: config.OwnerName,

      buttons: [
        buildSelectButton(
          "Filter Item",
          "Silahkan pilih item",
          filteredData.map((item) => {
            const statText =
              operator && statName
                ? getMatchedStat(item.Effects, statName)
                : formatStats(item.Effects).split("\n")[0] || "Tidak ada stat";

            return {
              title: item.ItemName,

              description: statText.slice(0, 72),

              id: `.item ${item.ItemName}`,
            };
          }),
        ),
      ],

      bottom_sheet: true,
      bottom_name: "Menu Item",
    });
  } catch (err) {
    console.log("ERR ITEM FILTER:", err);

    await sendText(conn, m.chat, "terjadi error tidak terduga", m);
  }
};

handler.command = "itemfilter";

handler.category = "Toram Search";

export default handler;
