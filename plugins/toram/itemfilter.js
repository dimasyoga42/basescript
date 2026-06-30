// import { config } from "../../config.js";
// import {
//   buildSelectButton,
//   sendFancyText,
//   sendText,
// } from "../../src/config/message.js";
// import { supa } from "../../src/config/supa.js";

// const STAT_PATTERNS = [
//   {
//     aliases: ["atk", "attack", "atk%", "attack%", "atk %"],
//     patterns: ["ATK %", "Weapon ATK %", "ATK"],
//     exact: true,
//   },
//   {
//     aliases: ["matk", "magic atk", "magic attack", "m atk"],
//     patterns: ["MATK %", "MATK"],
//     exact: true,
//   },
//   {
//     aliases: ["cr", "crt", "critical", "critical rate", "crit rate"],
//     patterns: ["Critical Rate", "Critical Rate %"],
//   },
//   {
//     aliases: ["cd", "critical damage", "crit damage", "c dmg", "cdmg"],
//     patterns: ["Critical Damage", "Critical Damage %"],
//   },
//   {
//     aliases: ["hp", "maxhp", "max hp"],
//     patterns: ["MaxHP", "MaxHP %"],
//     exact: true,
//   },
//   {
//     aliases: ["maxmp", "max mp"],
//     patterns: ["MaxMP", "MaxMP %"],
//     exact: true,
//   },
//   {
//     aliases: ["ampr", "attack mp recovery", "mp recovery"],
//     patterns: ["Attack MP Recovery"],
//   },
//   {
//     aliases: ["aspd", "attack speed"],
//     patterns: ["ASPD", "ASPD %"],
//     exact: true,
//   },
//   {
//     aliases: ["cspd", "cast speed"],
//     patterns: ["CSPD", "CSPD %"],
//     exact: true,
//   },
//   {
//     aliases: ["pp", "physical pierce", "phys pierce", "pierce"],
//     patterns: ["Physical Pierce %"],
//   },
//   {
//     aliases: ["mpierce", "magic pierce", "mp"],
//     patterns: ["Magic Pierce %"],
//   },
//   {
//     aliases: ["srd", "short range", "short range damage"],
//     patterns: ["Short Range Damage %"],
//   },
//   {
//     aliases: ["lrd", "long range", "long range damage"],
//     patterns: ["Long Range Damage %"],
//   },
//   {
//     aliases: ["pres", "physical resistance"],
//     patterns: ["Physical Resistance %"],
//   },
//   {
//     aliases: ["mres", "magic resistance"],
//     patterns: ["Magic Resistance %"],
//   },
//   {
//     aliases: ["aggro"],
//     patterns: ["Aggro %"],
//   },
//   {
//     aliases: ["stability", "stab"],
//     patterns: ["Stability %", "Stability %"],
//   },
//   {
//     aliases: ["watk", "weapon atk", "base atk"],
//     patterns: ["Weapon ATK"],
//   },
//   {
//     aliases: ["def", "base def"],
//     patterns: ["DEF", "DEF %"],
//     exact: true,
//   },
//   {
//     aliases: ["dte earth", "dte bumi"],
//     patterns: [
//       "stronger Againt Earth",
//       " % stronger Againt Earth",
//       "stronger Againt Earth %",
//     ],
//   },
//   {
//     aliases: ["dte dark", "dte gelap", "dte Gelap", "dte Dark"],
//     patterns: [
//       "stronger Againt Dark",
//       "stronger Againt Dark %",
//       "% stronger Againt Dark",
//     ],
//   },
//   {
//     aliases: ["dte api", "dte Api", "dte Fire", "dte fire"],
//     patterns: [
//       "stronger Againt Fire",
//       "stronger Againt Fire %",
//       "% stronger Againt Fire",
//     ],
//     exact: true,
//   },
//   {
//     aliases: ["dte water", "dte Water", "dte air", "dte Air"],
//     patterns: [
//       "stronger Againt Water",
//       "stronger Againt Water %",
//       "% stronger Againt Water",
//     ],
//     exact: true,
//   },
//   {
//     aliases: ["dte Cahaya", "dte cahaya", "dte ligth", "dte Ligth"],
//     patterns: [
//       "stronger Againt Ligth",
//       "% stronger Againt Ligth",
//       "stronger Againt Ligth %",
//     ],
//     exact: true,
//   },
// ];

// const CATEGORY_FLAGS = {
//   "--add": "Additional",
//   "--ohs": "1 Handed Sword",
//   "--ths": "2 Handed Sword",
//   "--bow": "Bow",
//   "--bwg": "Bowgun",
//   "--hb": "Halberd",
//   "--staff": "Staff",
//   "--knuck": "Knuckles",
//   "--dagger": "Dagger",
//   "--arrow": "Arrow",
//   "--ring": "Special",
//   "--md": "magic divace",
// };

// const normalizeText = (text = "") =>
//   text
//     .toLowerCase()
//     .replace(/[()%:+\-_/.,]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim();

// const buildWordBoundaryRegex = (pattern) => {
//   const normalized = normalizeText(pattern);
//   const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//   return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
// };

// const PATTERN_REGEX_CACHE = new Map();

// const getPatternRegex = (pattern) => {
//   if (PATTERN_REGEX_CACHE.has(pattern)) {
//     return PATTERN_REGEX_CACHE.get(pattern);
//   }
//   const regex = buildWordBoundaryRegex(pattern);
//   PATTERN_REGEX_CACHE.set(pattern, regex);
//   return regex;
// };

// const resolveStatEntry = (keyword) => {
//   const normalized = normalizeText(keyword);

//   for (const stat of STAT_PATTERNS) {
//     if (!Array.isArray(stat.aliases)) continue;

//     const matched = stat.aliases.some((alias) => {
//       if (!alias) return false;
//       const normalizedAlias = normalizeText(alias);
//       if (stat.exact) {
//         return normalized === normalizedAlias;
//       }
//       return (
//         normalized.includes(normalizedAlias) ||
//         normalizedAlias.includes(normalized)
//       );
//     });

//     if (matched) return stat;
//   }

//   return null;
// };

// const parseCompareQuery = (query) => {
//   const operators = [">=", "<=", ">", "<", "="];

//   for (const op of operators) {
//     const escaped = op.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     const regex = new RegExp(
//       `^(.+?)\\s*${escaped}\\s*(-?\\d+(?:\\.\\d+)?)$`,
//       "i",
//     );
//     const match = query.trim().match(regex);

//     if (!match) continue;

//     const statName = match[1].trim().replace(/\s+/g, " ");
//     const compareValue = Number(match[2]);

//     if (!statName || Number.isNaN(compareValue)) return null;

//     return { operator: op, statName, compareValue };
//   }

//   return null;
// };

// const formatStats = (stats = "") =>
//   stats
//     .split("|")
//     .map((s) => s.trim())
//     .filter((s) => s && !/^amount$/i.test(s))
//     .join("\n");

// const extractStatValue = (effects, statEntry) => {
//   if (!effects || !statEntry) return null;

//   const stats = effects
//     .split("|")
//     .map((s) => s.trim())
//     .filter(Boolean);

//   for (const stat of stats) {
//     const normalizedStat = normalizeText(stat);
//     const matched = statEntry.patterns.some((pattern) =>
//       getPatternRegex(pattern).test(normalizedStat),
//     );

//     if (!matched) continue;

//     const numberMatch = stat.match(/([+-]?\d+(?:\.\d+)?)/);
//     if (!numberMatch) continue;

//     return Number(numberMatch[1]);
//   }

//   return null;
// };

// const getMatchedStat = (effects, statEntry) => {
//   if (!effects || !statEntry) return "Stat tidak ditemukan";

//   const found = effects
//     .split("|")
//     .map((s) => s.trim())
//     .find((stat) => {
//       const normalizedStat = normalizeText(stat);
//       return statEntry.patterns.some((pattern) =>
//         getPatternRegex(pattern).test(normalizedStat),
//       );
//     });

//   return found ?? "Stat tidak ditemukan";
// };

// const compareValue = (actual, operator, target) => {
//   switch (operator) {
//     case ">":
//       return actual > target;
//     case "<":
//       return actual < target;
//     case ">=":
//       return actual >= target;
//     case "<=":
//       return actual <= target;
//     case "=":
//       return actual === target;
//     default:
//       return false;
//   }
// };

// const formatItem = (item) =>
//   `*${item.ItemName}*
// ${item.Category || "-"}

// ${formatStats(item.Effects)}

// proses:
// - ${item.Process || "-"}
// - ${item.Duration || "-"}
// - ${item.ObtainedFrom || "-"}`.trim();

// const handler = async (m, { conn }) => {
//   try {
//     const text = m.text ?? "";
//     let query = text.replace(/^\.itemfilter\s*/i, "").trim();

//     if (!query) {
//       return sendText(
//         conn,
//         m.chat,
//         `Contoh:
// .itemfilter atk
// .itemfilter atk>10 --ohs
// .itemfilter cr>=30
// .itemfilter cd<=20 --add
// .itemfilter ampr>20
// .itemfilter srd>=10
// .itemfilter watk>300

// Category:
// --ohs
// --bwg
// --hb
// --ths
// --staff
// --knuck
// --bow
// --dagger
// --arrow
// --add
// --ring`,
//         m,
//       );
//     }

//     let categoryFilter = null;
//     const lowerQuery = query.toLowerCase();

//     for (const [flag, category] of Object.entries(CATEGORY_FLAGS)) {
//       if (lowerQuery.includes(flag)) {
//         categoryFilter = category;
//         query = query.replaceAll(flag, "").trim();
//         break;
//       }
//     }

//     const parsedCompare = parseCompareQuery(query);
//     const operator = parsedCompare?.operator ?? null;
//     const statName = parsedCompare?.statName ?? null;
//     const targetValue = parsedCompare?.compareValue ?? null;

//     const statEntry = statName ? resolveStatEntry(statName) : null;

//     let db = supa
//       .from("item_v2")
//       .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom");

//     if (statEntry) {
//       db = db.or(
//         statEntry.patterns.map((p) => `Effects.ilike.%${p}%`).join(","),
//       );
//     } else if (operator && statName) {
//       db = db.ilike("Effects", `%${statName}%`);
//     } else {
//       db = db.ilike("Effects", `%${query}%`);
//     }

//     if (categoryFilter) {
//       db = db.eq("Category", categoryFilter);
//     }

//     const { data, error } = await db;

//     if (error) {
//       console.error("ERR ITEM FILTER DB:", error.message);
//       return sendText(conn, m.chat, "terjadi kesalahan saat mengambil data", m);
//     }

//     if (!data?.length) {
//       return sendText(
//         conn,
//         m.chat,
//         "item dengan stat tersebut tidak ditemukan",
//         m,
//       );
//     }

//     let filteredData = data;

//     if (operator && targetValue !== null) {
//       filteredData = data.filter((item) => {
//         const value = extractStatValue(item.Effects, statEntry);
//         if (value === null) return false;
//         return compareValue(value, operator, targetValue);
//       });
//     } else if (statEntry) {
//       filteredData = data.filter((item) => {
//         const stats =
//           item.Effects?.split("|")
//             .map((s) => s.trim())
//             .filter(Boolean) ?? [];
//         return stats.some((stat) => {
//           const normalized = normalizeText(stat);
//           return statEntry.patterns.some((p) =>
//             getPatternRegex(p).test(normalized),
//           );
//         });
//       });
//     }

//     if (!filteredData.length) {
//       return sendText(
//         conn,
//         m.chat,
//         "tidak ada item yang cocok dengan filter tersebut",
//         m,
//       );
//     }

//     if (filteredData.length === 1) {
//       return sendFancyText(conn, m.chat, formatItem(filteredData[0]), m);
//     }

//     const displayQuery = parsedCompare
//       ? `${statName} ${operator} ${targetValue}`
//       : query;

//     return await conn.sendButton(m.chat, {
//       text: `Ditemukan *${filteredData.length}* item untuk query _${displayQuery}_${
//         categoryFilter ? ` (${categoryFilter})` : ""
//       }

// Pilih salah satu item:`,

//       footer: config.OwnerName,

//       buttons: [
//         buildSelectButton(
//           "Filter Item",
//           "Silahkan pilih item",
//           filteredData.map((item) => {
//             const statText = statEntry
//               ? getMatchedStat(item.Effects, statEntry)
//               : (formatStats(item.Effects).split("\n")[0] ?? "Tidak ada stat");

//             return {
//               title: item.ItemName,
//               description: statText.slice(0, 72),
//               id: `.item ${item.ItemName}`,
//             };
//           }),
//         ),
//       ],

//       bottom_sheet: true,
//       bottom_name: "Menu Item",
//     });
//   } catch (err) {
//     console.error("ERR ITEM FILTER:", err);
//     await sendText(conn, m.chat, "terjadi error tidak terduga", m);
//   }
// };

// handler.command = "itemfilter";
// handler.category = "Toram Search";

// export default handler;
