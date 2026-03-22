import { generateWAMessageFromContent, proto } from "@whiskeysockets/baileys";
import axios from "axios";
import { config, thumbnail } from "../../config.js";

const toSmallCaps = (text) => {
  const map = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ꜰ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] || c)
    .join("");
};

const CATEGORY_EMOJIS = {
  main: "🏠",
  tools: "🛠️",
  fun: "🎮",
  group: "👥",
  download: "📥",
  media: "🎬",
  toram: "⚔️",
  owner: "👑",
  ai: "🤖",
  info: "ℹ️",
  other: "📋",
};

const getThumbnailBuffer = async () => {
  try {
    if (!thumbnail) return null;
    const res = await axios.get(thumbnail, { responseType: "arraybuffer" });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
};

const handler = async (m, { conn }) => {
  try {
    const categories = {};

    for (const name in global.plugins) {
      const plugin = global.plugins[name];
      if (!plugin?.command) continue;
      const cmds = Array.isArray(plugin.command)
        ? plugin.command
        : [plugin.command];
      const cat = (plugin.category || "other").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(...cmds);
    }

    // build teks menu
    let txt = `Hai *${m.pushName || "User"}* 👋\n\n`;
    for (const cat of Object.keys(categories).sort()) {
      const emoji = CATEGORY_EMOJIS[cat] || "📋";
      txt += `╭┈┈⬡「 ${emoji} *${toSmallCaps(cat)}* 」\n`;
      for (const cmd of categories[cat]) {
        txt += `┃ ◦ ${config.prefix}${toSmallCaps(cmd)}\n`;
      }
      txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    }
    txt += `_© ${config.BotName} | Dev: ${config.OwnerName}_`;

    const thumbBuffer = await getThumbnailBuffer();

    const msg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: txt },
              footer: { text: `${config.BotName} • ${config.Version}` },
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 777,
                isForwarded: true,
                externalAdReply: {
                  title: config.BotName,
                  body: `Developer: ${config.OwnerName}`,
                  mediaType: 1,
                  thumbnail: thumbBuffer,
                  renderLargerThumbnail: true,
                },
              },
              nativeFlowMessage: {
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🏠 Menu",
                      id: `${config.prefix}menu`,
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
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "ℹ️ Info",
                      id: `${config.prefix}info`,
                    }),
                  },
                ],
              },
            },
          },
        },
      }),
      { quoted: m, userJid: conn.user?.id },
    );

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch (err) {
    console.error("[menu]", err.message);

    // fallback teks biasa
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

    let txt = `*MENU ${config.BotName}*\n`;
    for (const cat in categories) {
      txt += `\n*${cat.toUpperCase()}*\n`;
      txt +=
        categories[cat].map((c) => `• ${config.prefix}${c}`).join("\n") + "\n";
    }

    await conn.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
  }
};

handler.command = ["menutest"];
handler.category = "main";
handler.submenu = "Main";
export default handler;
