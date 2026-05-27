import { config } from "../config.js";
import { scrapeBoostBoss } from "./toram/boost.js";
import { sendFancyTextModif } from "../src/config/message.js";

const handler = async (m, { conn }) => {
  let dataBoses = { active: false, bosses: [] };
  try {
    dataBoses = await scrapeBoostBoss();
  } catch (e) {
    console.error("[menu] gagal scrape boss:", e.message);
  }

  const { plugins } = await import("./index.js");

  const categories = {};
  for (const name in plugins) {
    const plugin = plugins[name];
    if (!plugin?.command) continue;
    const cmds = Array.isArray(plugin.command)
      ? plugin.command
      : [plugin.command];
    const cat = plugin.category || "other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(...cmds);
  }

  let bossSection;
  if (!dataBoses.active) {
    bossSection = dataBoses.expired
      ? `*Bos Boost:* Event berakhir ${dataBoses.lastDate}`
      : `*Bos Boost:* Tidak ada event aktif saat ini`;
  } else {
    const bossList = dataBoses.bosses
      .map((b) => `  - ${b.name} (${b.level}): ${b.location || "-"}`)
      .join("\n");
    bossSection = `*Bos Boosting* (s/d ${dataBoses.endDateStr}):\n${bossList}`;
  }

  const commandSection = Object.entries(categories)
    .map(
      ([cat, cmds]) =>
        `╭─ *${cat}*\n` + cmds.map((c) => `│ .${c}`).join("\n") + `\n╰────`,
    )
    .join("\n\n");

  const result = `${bossSection}\n\n${commandSection}`;

  const randomThumb =
    config.thumbnail[Math.floor(Math.random() * config.thumbnail.length)];

  await sendFancyTextModif(conn, m.chat, {
    name: m.pushName,
    image: randomThumb,
    caption: result.trim(),
    quoted: m,
  });
};

handler.command = ["menu", "help"];
handler.category = "Menu Grub";
export default handler;
