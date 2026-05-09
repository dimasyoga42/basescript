import { config, thumbnail } from "../config.js";
import {
  buildSelectButton,
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

  let result =
    "*Cara Penggunaan:*\n- gunakan .menu / .help untuk menampilkan menu bot\n- pilih salah satu fitur yang anda ingin gunakan\n- jika anda tidak paham cara penggunaan ketikan saja command yang anda ingin gunakan nanti bot akan memberikan intruksi penggunaan\n- gunakan .saran untuk memberikan masukan\n\n *Aturan Penggunaan:*\n- Dilarang Keras Spam command di batas tidak wajar\n- Dilarang Menggunakan tools stiker brat pin untuk hal hal kurang etis (vulgar, rasis, dll) melanggar banned\n";

  for (const cat in categories) {
    result += `\n╭─ *${cat}*\n`;
    result += categories[cat].map((c) => `│.${c}`).join("\n") + "\n╰────\n";
  }

  const randomThumb =
    config.thumbnail[Math.floor(Math.random() * config.thumbnail.length)];

  // await sendMenu(conn, m.chat, {
  //   title: m.pushName,
  //   body: "Hanami Event",
  //   text: result.trim(),
  //   thumbnail: randomThumb,
  //   quoted: m,
  // });
  // await sendFancyTextModif(conn, m.chat, {
  //   title: "Neura Sama",
  //   body: "Selalu siap Untuk mu",
  //   name: `hello ${m.pushName}`,
  //   text: result.trim(),
  //   thumbnail: randomThumb,
  // });
  // conn.sendMessage(m.chat, { text: result.trim() }, { quoted: m });
  await conn.sendButton(m.chat, {
    image: {
      url: randomThumb,
    },
    caption: result.trim(),
    footer: "Neura Inc",
    button: [
      buildSelectButton(
        "Neura",
        "Menu Favorit",

        [
          {
            title: "Trait",
            description: "Daftar Trait",
            id: ".trait",
          },

          {
            title: "Skill",
            description: "Daftar Skill",
            id: ".skill",
          },
        ],
      ),
    ],

    bottom_sheet: true,
    bottom_name: "Neura",
  });
};

handler.command = ["menu", "help"];
handler.category = "Menu Grub";

export default handler;
