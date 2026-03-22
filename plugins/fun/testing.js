import axios from "axios";
import { config, thumbnail } from "../../config.js";

const handler = async (m, { conn }) => {
  try {
    const thumbBuffer = thumbnail
      ? await axios
          .get(thumbnail, { responseType: "arraybuffer" })
          .then((r) => Buffer.from(r.data))
          .catch(() => null)
      : null;

    // Bangun teks menu dari plugins
    const categories = {};
    for (const name in global.plugins) {
      const plugin = global.plugins[name];
      if (!plugin?.command) continue;
      const cmds = Array.isArray(plugin.command)
        ? plugin.command
        : [plugin.command];
      const cat = plugin.category || "other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(...cmds);
    }

    let menuText = `*MENU ${config.BotName}*\n`;
    for (const cat in categories) {
      menuText += `\n*${cat.toUpperCase()}*\n`;
      menuText +=
        categories[cat].map((c) => `• ${config.prefix}${c}`).join("\n") + "\n";
    }

    // Kirim button utama
    await conn.sendMessage(
      m.chat,
      {
        image: thumbBuffer || { url: thumbnail },
        caption: `Hai *${m.pushName || "User"}* 👋\nPilih menu di bawah ini:`,
        title: config.BotName,
        subtitle: `Developer: ${config.OwnerName}`,
        footer: config.BotName,
        viewOnce: true,
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "menu",
              // ✅ id = command yang akan dipanggil bot
              id: `.menu`,
            }),
          },
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "🏓 Ping",
              id: `${config.prefix}ping`,
            }),
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "🌐 Website",
              url: "https://github.com",
            }),
          },
        ],
        bottom_sheet: true, //kalau mau button dalam button
        bottom_name: "Bottom sheet",
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("[menutes]", err.message);
    await conn.sendMessage(
      m.chat,
      {
        text: `*${config.BotName}*\n\n• ${config.prefix}ping\n• ${config.prefix}menu`,
      },
      { quoted: m },
    );
  }
};

handler.command = ["menutes"];
handler.category = "main";
handler.submenu = "Main";
export default handler;
