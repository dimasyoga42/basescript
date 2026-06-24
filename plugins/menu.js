import { config } from "../config.js";
import { scrapeBoostBoss } from "./toram/boost.js";
import {
  demoButtonV2,
  sendFancyText,
  sendFancyTextModif,
} from "../src/config/message.js";
import { supa } from "../src/config/supa.js";
import { buildAvaGrid } from "./_function/_format.js";
import axios from "axios";
const handler = async (m, { conn }) => {
  const image = await buildAvaGrid(
    "https://neurapi.mochinime.cyou/api/toram/ava",
  );
  // Scrape boost boss
  let dataBoses = { active: false, bosses: [] };
  try {
    dataBoses = await scrapeBoostBoss();
  } catch (e) {
    console.error("[menu] gagal scrape boss:", e.message);
  }

  // Load plugins
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

  // Query bospeek dari Supabase
  let bospeekSection = "*Bos Puncak:* Data tidak tersedia";
  const { data: dataPeek, error: peekError } = await supa
    .from("bospeek")
    .select("*")
    .eq("active", true);

  if (peekError) {
    console.error("[menu] gagal ambil bospeek:", peekError.message);
  } else if (dataPeek?.length) {
    bospeekSection =
      `*Puncak Petualang:*\n` +
      dataPeek.map((item) => `  - ${item.name} - ${item.element}`).join("\n");
  } else {
    bospeekSection = "*Bos Puncak Petualang:* Tidak ada bos aktif";
  }

  // Section boost boss
  let bossSection;
  if (!dataBoses.active) {
    bossSection = dataBoses.expired
      ? `*Bos Boost:* Event berakhir ${dataBoses.lastDate}`
      : `*Bos Boost:* Tidak ada event aktif saat ini`;
  } else {
    const bossList = dataBoses.bosses
      .map((b) => `${b.name} (${b.level}): ${b.location || "-"}`)
      .join("\n- ");
    bossSection = `*Bos Boosting*:\n${bossList}`;
  }
  let ava;
  const res = await axios.get("https://neurapi.mochinime.cyou/api/toram/ava");
  const data = res.data.result;
  const vals = data.data.map((item) => `- ${item.name}`).join("\n");
  ava = `*Ava Terbaru*:\n${vals}`;

  // Section command
  const commandSection = Object.entries(categories)
    .map(
      ([cat, cmds]) =>
        `╭─ *${cat}*\n` + cmds.map((c) => `│ .${c}`).join("\n") + `\n╰────`,
    )
    .join("\n\n");

  const result = `${bossSection}\n\n${ava}\n\n${commandSection}`;

  const randomThumb =
    config.thumbnail[Math.floor(Math.random() * config.thumbnail.length)];

  // await sendFancyTextModif(conn, m.chat, {
  //   name: m.pushName,
  //   image:
  //     "https://raw.githubusercontent.com/dimasyoga42/basescript/refs/heads/main/1.png",
  //   caption: result.trim(),
  //   quoted: m,
  // });
  await demoButtonV2(
    conn,
    m,
    "Neura Sama",
    result,
    "Neura Inc",
    "siap Melayani Anda",
    randomThumb,
  );
};
handler.command = "menu";
handler.alias = ["help"];
handler.category = "Menu Grub";
export default handler;
