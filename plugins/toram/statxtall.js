import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const STAT_PATTERNS = [
  {
    aliases: ["atk", "attack", "atk%", "attack%"],
    patterns: ["ATK%", "Weapon ATK%", "ATK"],
    exact: true,
  },
  {
    aliases: ["matk", "magic atk", "magic attack", "m atk"],
    patterns: ["MATK%", "MATK"],
    exact: true,
  },
  {
    aliases: ["cr", "crt", "critical", "critical rate", "crit rate"],
    patterns: [
      "Critical Rate%",
      "Critical Rate %",
      "Critical Rate",
      "Cirtical Rate %",
      "Cirtical Rate",
    ],
  },
  {
    aliases: ["cd", "critical damage", "crit damage", "c dmg", "cdmg"],
    patterns: ["Critical Damage%", "Critical Damage"],
  },
  {
    aliases: ["hp", "maxhp", "max hp"],
    patterns: ["MaxHP%", "MaxHP"],
    exact: true,
  },
  {
    aliases: ["mp", "maxmp", "max mp"],
    patterns: ["MaxMP%", "MaxMP"],
    exact: true,
  },
  {
    aliases: ["ampr", "attack mp recovery", "mp recovery"],
    patterns: ["Attack MP Recovery%", "Attack MP Recovery"],
  },
  {
    aliases: ["aspd", "attack speed"],
    patterns: ["ASPD%", "ASPD"],
    exact: true,
  },
  {
    aliases: ["cspd", "cast speed"],
    patterns: ["CSPD%", "CSPD"],
    exact: true,
  },
  {
    aliases: ["pp", "physical pierce", "phys pierce", "pierce"],
    patterns: ["Physical Pierce%"],
  },
  {
    aliases: ["mpierce", "magic pierce"],
    patterns: ["Magic Pierce%"],
  },
  {
    aliases: ["srd", "short range", "short range damage"],
    patterns: ["Short Range Damage%", "Short Range Damage %"],
  },
  {
    aliases: ["lrd", "long range", "long range damage"],
    patterns: ["Long Range Damage%"],
  },
  {
    aliases: ["pres", "physical resistance"],
    patterns: ["Physical Resistance%"],
  },
  {
    aliases: ["mres", "magic resistance"],
    patterns: ["Magic Resistance%"],
  },
  {
    aliases: ["aggro"],
    patterns: ["Aggro%"],
  },
  {
    aliases: ["stability", "stab"],
    patterns: ["Base Stability%", "Stability%"],
  },
  {
    aliases: ["watk", "weapon atk", "base atk"],
    patterns: ["Weapon ATK%", "Weapon ATK"],
    exact: true,
  },
  {
    aliases: ["def"],
    patterns: ["DEF%", "DEF"],
    exact: true,
  },
  {
    aliases: ["str"],
    patterns: ["STR%", "STR"],
    exact: true,
  },
  {
    aliases: ["int"],
    patterns: ["INT%", "INT"],
    exact: true,
  },
  {
    aliases: ["vit"],
    patterns: ["VIT%", "VIT"],
    exact: true,
  },
  {
    aliases: ["dex"],
    patterns: ["DEX%", "DEX"],
    exact: true,
  },
  {
    aliases: ["agi"],
    patterns: ["AGI%", "AGI"],
    exact: true,
  },
  {
    aliases: ["mdef"],
    patterns: ["MDEF%", "MDEF"],
    exact: true,
  },
  {
    aliases: ["acc", "accuracy"],
    patterns: ["Accuracy%", "Accuracy"],
  },
  {
    aliases: ["dodge"],
    patterns: ["Dodge%", "Dodge"],
  },
  {
    aliases: ["ailment", "ailment resistance"],
    patterns: ["Ailment Resistance%", "Ailment Resistence %"],
  },
  {
    aliases: ["mspd", "motion speed"],
    patterns: ["Motion Speed%", "Motion Speed %"],
  },
  {
    aliases: ["anticipate"],
    patterns: ["Anticipate%", "Anticipate %", "anticipate %"],
  },
];

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[()%:+\-_/.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildWordBoundaryRegex = (pattern) => {
  const normalized = normalizeText(pattern);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
};

const PATTERN_REGEX_CACHE = new Map();

const getPatternRegex = (pattern) => {
  if (PATTERN_REGEX_CACHE.has(pattern)) {
    return PATTERN_REGEX_CACHE.get(pattern);
  }
  const regex = buildWordBoundaryRegex(pattern);
  PATTERN_REGEX_CACHE.set(pattern, regex);
  return regex;
};

const resolveStatEntry = (keyword) => {
  const normalized = normalizeText(keyword);

  for (const stat of STAT_PATTERNS) {
    const matched = stat.aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);
      if (stat.exact) {
        return normalized === normalizedAlias;
      }
      return (
        normalized.includes(normalizedAlias) ||
        normalizedAlias.includes(normalized)
      );
    });

    if (matched) return stat;
  }

  return null;
};

const parseCompareQuery = (query) => {
  const operators = [">=", "<=", ">", "<", "="];

  for (const op of operators) {
    const escaped = op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `^(.+?)\\s*${escaped}\\s*(-?\\d+(?:\\.\\d+)?)$`,
      "i",
    );
    const match = query.trim().match(regex);

    if (!match) continue;

    const statName = match[1].trim().replace(/\s+/g, " ");
    const compareValue = Number(match[2]);

    if (!statName || Number.isNaN(compareValue)) return null;

    return { operator: op, statName, compareValue };
  }

  return null;
};

const splitStats = (stats = "") =>
  stats
    .split(/\n|\r\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const extractStatValue = (stats, statEntry) => {
  if (!stats || !statEntry) return null;

  for (const line of splitStats(stats)) {
    const normalizedLine = normalizeText(line);
    const matched = statEntry.patterns.some((pattern) =>
      getPatternRegex(pattern).test(normalizedLine),
    );

    if (!matched) continue;

    const numberMatch = line.match(/([+-]?\d+(?:\.\d+)?)/);
    if (!numberMatch) continue;

    return Number(numberMatch[1]);
  }

  return null;
};

const getMatchedStat = (stats, statEntry) => {
  if (!stats || !statEntry) return "Stat tidak ditemukan";

  const found = splitStats(stats).find((line) => {
    const normalizedLine = normalizeText(line);
    return statEntry.patterns.some((pattern) =>
      getPatternRegex(pattern).test(normalizedLine),
    );
  });

  return found ?? "Stat tidak ditemukan";
};

const matchesOperator = (actual, operator, target) => {
  switch (operator) {
    case ">":
      return actual > target;
    case "<":
      return actual < target;
    case ">=":
      return actual >= target;
    case "<=":
      return actual <= target;
    case "=":
      return actual === target;
    default:
      return false;
  }
};

const formatStats = (stats = "") => splitStats(stats).join("\n");

const handler = async (m, { conn }) => {
  try {
    const text = m.text ?? "";
    const query = text.replace(/^\.statsxtal\s*/i, "").trim();

    if (!query) {
      return sendText(
        conn,
        m.chat,
        `Contoh:
.statsxtal atk
.statsxtal cr>=30
.statsxtal cd<=20
.statsxtal ampr>5
.statsxtal srd>=10
.statsxtal matk>100
.statsxtal aspd=100
.statsxtal hp>=1000`,
        m,
      );
    }

    const parsedCompare = parseCompareQuery(query);
    const operator = parsedCompare?.operator ?? null;
    const statName = parsedCompare?.statName ?? null;
    const targetValue = parsedCompare?.compareValue ?? null;

    const statEntry = statName
      ? resolveStatEntry(statName)
      : resolveStatEntry(query);

    let db = supa.from("xtal").select("name, stats").limit(100);

    if (statEntry) {
      db = db.or(statEntry.patterns.map((p) => `stats.ilike.%${p}%`).join(","));
    } else if (operator && statName) {
      db = db.ilike("stats", `%${statName}%`);
    } else {
      db = db.ilike("stats", `%${query}%`);
    }

    const { data, error } = await db;

    if (error) {
      console.error("ERR STATS XTAL DB:", error.message);
      return sendText(conn, m.chat, "terjadi kesalahan saat mengambil data", m);
    }

    if (!data?.length) {
      return sendText(conn, m.chat, "stat yang dicari tidak ditemukan", m);
    }

    let filteredData = data;

    if (operator && targetValue !== null) {
      filteredData = data.filter((item) => {
        const value = extractStatValue(item.stats, statEntry);
        if (value === null) return false;
        return matchesOperator(value, operator, targetValue);
      });
    } else if (statEntry) {
      filteredData = data.filter((item) => {
        return splitStats(item.stats).some((line) => {
          const normalized = normalizeText(line);
          return statEntry.patterns.some((p) =>
            getPatternRegex(p).test(normalized),
          );
        });
      });
    }

    if (!filteredData.length) {
      return sendText(
        conn,
        m.chat,
        "tidak ada xtal yang cocok dengan filter tersebut",
        m,
      );
    }

    if (filteredData.length === 1) {
      return sendText(conn, m.chat, `.xtal ${filteredData[0].name}`, m);
    }

    const displayQuery = parsedCompare
      ? `${statName} ${operator} ${targetValue}`
      : query;

    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${filteredData.length}* xtal untuk query _${displayQuery}_

Pilih salah satu:`,

      footer: config.OwnerName,

      buttons: [
        buildSelectButton(
          "List Xtal",
          "Silahkan pilih xtal",
          filteredData.map((item) => {
            const statText = statEntry
              ? getMatchedStat(item.stats, statEntry)
              : (formatStats(item.stats).split("\n")[0] ?? "Tidak ada stat");

            return {
              title: item.name,
              description: statText.slice(0, 72),
              id: `.xtal ${item.name}`,
            };
          }),
        ),
      ],

      bottom_sheet: true,
      bottom_name: "List Xtal",
    });
  } catch (err) {
    console.error("ERR STATS XTAL:", err);
    await sendText(conn, m.chat, "terjadi error tidak terduga", m);
  }
};

handler.command = "statsxtal";
handler.category = "Toram Search";

export default handler;
