import { config, thumbnail } from "../config.js";
import { scrapeBoostBoss } from "./toram/boost.js";
import { sendFancyText, sendFancyTextModif, sendMenu } from "../src/config/message.js";
import { supa } from "../src/config/supa.js";
import { buildAvaGrid } from "./_function/_format.js";
import axios from "axios";
import { demoButtonV2, thumb } from "../src/config/ms.js";

const handler = async (m, { conn }) => {
  let image = null;
  try {
    image = await buildAvaGrid("https://neurapi.mochinime.cyou/api/toram/ava");
  } catch (e) {
    console.error("[menu] gagal build ava grid:", e.message);
  }

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


  // Section command
  const commandSection = Object.entries(categories)
    .map(
      ([cat, cmds]) =>
        `_${cat}_\n` + cmds.map((c) => `➤ .${c}`).join("\n") + `\n`,
    )
    .join("\n\n").trim();

  const result = `*Informasi Bot*\nLibrary: Luna-lib(JS)\nVersion: 1.2.5\nWebsite: https://dimasyogaaa.vercel.app\nOwner:Dimas Yoga (0856643933331)\n\n*Rules*\n- dilarang spam cmd tertentu\n- dilarang membuat stiker jomok\n- bot hanya merespon chat grub tidak chat pribadi\n\n${commandSection}`;

  const randomThumb =
    config.thumbnail[Math.floor(Math.random() * config.thumbnail.length)];

  // await sendFancyTextModif(conn, m.chat, {
  //   name: m.pushName,
  //   image: randomThumb,
  //   caption: result.trim(),
  //   quoted: m,
  // });

  // await demoButtonV2(
  //   conn,
  //   m,
  //   "Neura Sama",
  //   result,
  //   "Neura Inc",
  //   config.msgtxt[Math.floor(Math.random() * config.msgtxt.length)],
  //   randomThumb,
  // );
  await thumb(conn, m, config.BotName, result, config.OwnerName, config.msgtxt[Math.floor(Math.random() * config.msgtxt.length)], "https://server.neurasama.my.id/etc/thumbnail")
  // await sendFancyText(conn, m.chat, {
  //   title: config.BotName,
  //   body: "selalu ada",
  //   text: result,
  //   thumbnail: "https://server.neurasama.my.id/etc/thumbnail",
  //   quoted: m
  // })
};

handler.command = "menu";
handler.alias = ["help"];
handler.category = "Menu Grub";

export default handler;
