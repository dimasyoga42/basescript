import { config } from "../config.js";
import {
  sendFancyText,
  sendFancyTextModif,
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

  const thumbnails = (config?.thumbnail ?? []).filter(Boolean);
  const thumbnail = thumbnails[Math.floor(Math.random() * thumbnails.length)];
  await conn.sendMessage(
    m.chat,
    {
      text: result.trim(),
      footer: `Develope By ${config.OwnerName}`,
      viewOnce: true,
      contextInfo: {
        externalAdReply: {
          title: m.pushName,
          body: "selamat menikmati fitur yang tersedia",
          thumbnailUrl: thumbnail,
          mediaType: 1,
          renderLargerThumbnail: true, // 🔥 kecil di samping
          showAdAttribution: false,
        },
      },
      buttons: [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "⭐Donasi Sekarang",
            url: "https://sociabuzz.com/neurabot/tribe",
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Follow Github",
            url: "https://github.com/dimasyoga42",
          }),
        },
      ],
    },
    { quoted: m },
  );
};

handler.command = ["menu", "help"];
handler.category = "main";
export default handler;
