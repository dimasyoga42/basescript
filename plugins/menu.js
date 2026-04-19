import { config, thumbnail } from "../config.js";
import {
  sendFancyText,
  sendFancyTextModif,
  sendMenu,
  sendText,
} from "../src/config/message.js";

const handler = async (m, { conn }) => {
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
  const Namemesage = m.pushName;

  let result =
    "*Rules*\n- no spamming on bots is allowed\n- It is prohibited to make stickers that are vulgar and contain LGBT, racist, or SARA elements.\n- it is forbidden to make inappropriate conversations to artificial intelligence\n";
  for (const cat in categories) {
    result += `\n╭─${cat}\n`;
    result += categories[cat].map((c) => `│.${c}`).join("\n") + "\n╰────\n";
  }
  await sendMenu(conn, m.chat, {
    title: m.pushName,
    body: "Selamat Menikmati fitur yang tersedia",
    text: result.trim(),
    thumbnail: thumbnail,
    quoted: m,
  });
};

handler.command = ["menu", "help"];
handler.category = "Menu Grub";
export default handler;
