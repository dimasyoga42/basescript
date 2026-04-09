import axios from "axios";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

const XTAL_URL =
  "https://raw.githubusercontent.com/dimasyoga42/dataset/refs/heads/main/xtal_data.json";

let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 5 * 60 * 1000;

const fetchXtalData = async () => {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL) return cache.data;
  const { data } = await axios.get(XTAL_URL);
  if (!Array.isArray(data)) throw new Error("Format data tidak valid");
  cache = { data, fetchedAt: now };
  return data;
};

const formatXtal = (xtall) => {
  const statsText = Object.entries(xtall.stats || {})
    .map(([key, val]) => {
      const cleanKey = key.replace(/\s+/g, " ").trim();
      const cleanVal = String(val)
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      return `- ${cleanKey} : ${cleanVal}`;
    })
    .join("\n");

  return (
    `*${xtall.name} - ${xtall.type}*\n` +
    `${statsText}\n` +
    `Upgrade Route :\n- ${xtall.upgrade_route || "-"}\n` +
    `Max Upgrade Route :\n- ${xtall.max_upgrade_route || "-"}\n` +
    `────────────`
  );
};

const handler = async (m, { conn }) => {
  try {
    const query = m.text.split(" ").slice(1).join(" ").trim();
    if (!query)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}, use: .xtal name\n.xtal --all`,
        m,
      );

    const data = await fetchXtalData();

    // ✅ --all: tampilkan semua sebagai button tanpa batas
    if (query === "--all") {
      return await conn.sendButton(m.chat, {
        image: thumbnail,
        caption: `Total *${data.length}* xtal tersedia.\nPilih salah satu:`,
        footer: config.OwnerName,
        buttons: data.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: `${item.name} (${item.type})`,
            id: `.xtal ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Xtal List",
      });
    }

    // ✅ Filter by name
    const result = data.filter((x) =>
      x?.name?.toLowerCase().includes(query.toLowerCase()),
    );

    if (!result.length)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });

    // ✅ Hasil tepat 1, langsung tampilkan detail
    if (result.length >= 2 || result.length === 1) {
      return sendText(conn, m.chat, formatXtal(result[0]), m);
    }

    // ✅ Hasil lebih dari 1, tampilkan semua sebagai button tanpa batas
    return await conn.sendButton(m.chat, {
      image: thumbnail,
      caption: `Ditemukan *${result.length}* xtal untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: result.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: `${item.name} (${item.type})`,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Xtal List",
    });
  } catch (err) {
    console.error("[xtal]", err);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = "xtal";
handler.alias = ["xtall"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
