import { config } from "../../config.js";
import {
  buildSelectButton,
  editText,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const formatStats = (stats = "") =>
  stats
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && !/^amount$/i.test(s))
    .join("\n");

const extractStatValue = (effects, keyword) => {
  if (!effects) return null;

  const regex = new RegExp(
    `${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*([+-]?\\d+)`,
    "i",
  );

  const match = effects.match(regex);

  if (!match) return null;

  return Number(match[1]);
};

const getMatchedStat = (effects, keyword) => {
  if (!effects) return "Stat tidak ditemukan";

  const found = effects
    .split("|")
    .map((s) => s.trim())
    .find((s) => s.toLowerCase().includes(keyword.toLowerCase()));

  return found || "Stat tidak ditemukan";
};

const formatItem = (item) => `*${item.ItemName}* ${item.Category || "-"}
${formatStats(item.Effects)}

proses:
- ${item.Process || "-"}
- ${item.Duration || "-"}
- ${item.ObtainedFrom || "-"}`;

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
.itemfilter cd<20 --add

Category yang tersedia:
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
--ring
--arm
`,
        m,
      );
    }

    let categoryFilter = null;

    if (/--add/i.test(query)) {
      categoryFilter = "Additional";
      query = query.replace(/--add/gi, "").trim();
    }

    if (/--ohs/i.test(query)) {
      categoryFilter = "1 Handed Sword";
      query = query.replace(/--ohs/gi, "").trim();
    }

    if (/--ths/i.test(query)) {
      categoryFilter = "2 Handed Sword";
      query = query.replace(/--ths/gi, "").trim();
    }

    if (/--bow/i.test(query)) {
      categoryFilter = "Bow";
      query = query.replace(/--bow/gi, "").trim();
    }

    if (/--bwg/i.test(query)) {
      categoryFilter = "Bowgun";
      query = query.replace(/--bwg/gi, "").trim();
    }

    if (/--hb/i.test(query)) {
      categoryFilter = "Halberd";
      query = query.replace(/--hb/gi, "").trim();
    }

    if (/--staff/i.test(query)) {
      categoryFilter = "Staff";
      query = query.replace(/--staff/gi, "").trim();
    }

    if (/--knuck/i.test(query)) {
      categoryFilter = "Knuckles";
      query = query.replace(/--knuck/gi, "").trim();
    }

    if (/--dagger/i.test(query)) {
      categoryFilter = "Dagger";
      query = query.replace(/--dagger/gi, "").trim();
    }

    if (/--arrow/i.test(query)) {
      categoryFilter = "Arrow";
      query = query.replace(/--arrow/gi, "").trim();
    }

    if (/--ring/i.test(query)) {
      categoryFilter = "Special";
      query = query.replace(/--ring/gi, "").trim();
    }
    if (/--arm/i.test(query)) {
      categoryFilter = "Armor";
      query = query.replace(/--arm/gi, "").trim();
    }

    let operator = null;
    let statName = null;
    let compareValue = null;

    const compareMatch = query.match(/^(.+?)([<>])(\d+)$/i);

    if (compareMatch) {
      statName = compareMatch[1].trim();
      operator = compareMatch[2];
      compareValue = Number(compareMatch[3]);
    }

    let db = supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom");

    if (operator && statName) {
      db = db.ilike("Effects", `%${statName}%`);
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

        if (value === null) return false;

        if (operator === ">") {
          return value > compareValue;
        }

        if (operator === "<") {
          return value < compareValue;
        }

        return false;
      });
    }

    if (!filteredData || filteredData.length === 0) {
      return sendText(
        conn,
        m.chat,
        "tidak ada item yang cocok dengan operator perbandingan",
        m,
      );
    }

    if (filteredData.length === 1) {
      return sendFancyText(conn, m.chat, formatItem(filteredData[0]).trim(), m);
    }

    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${filteredData.length}* item dengan stat: _${query}_${
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
    console.log("ERR ITEM FILTER:", err.message);

    await sendText(conn, m.chat, "terjadi error tidak terduga", m);
  }
};

handler.command = "itemfilter";
handler.category = "Toram Search";

export default handler;
