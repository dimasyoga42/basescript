import { generateWAMessageFromContent, proto } from "@whiskeysockets/baileys";
import { config, thumbnail } from "../../config.js";

const CATEGORY_EMOJIS = {
  main: "🏠",
  tools: "🛠️",
  fun: "🎮",
  group: "👥",
  download: "📥",
  search: "🔍",
  media: "🎬",
  toram: "⚔️",
  owner: "👑",
  ai: "🤖",
  game: "🎯",
  info: "ℹ️",
};

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

const handler = async (m, { conn }) => {
  try {
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

    let txt = `Hai *@${m.pushName || "User"}* 👋\n`;
    txt += `Aku *${config.BotName}*, bot WhatsApp siap membantu kamu!\n\n`;

    const sortedCats = Object.keys(categories).sort();

    for (const cat of sortedCats) {
      const emoji = CATEGORY_EMOJIS[cat.toLowerCase()] || "📋";
      txt += `╭┈┈⬡「 ${emoji} *${toSmallCaps(cat)}* 」\n`;
      for (const cmd of categories[cat]) {
        txt += `┃ ◦ *${config.prefix}${toSmallCaps(cmd)}*\n`;
      }
      txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
    }

    txt += `_© ${config.BotName} | Developer: ${config.OwnerName}_`;

    const msg = generateWAMessageFromContent(
      m.chat,
      proto.Message.fromObject({
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: txt },
              footer: { text: config.BotName },
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 777,
                isForwarded: true,
                externalAdReply: {
                  title: config.BotName,
                  body: `Developer: ${config.OwnerName}`,
                  mediaType: 1,
                  thumbnail: thumbnail
                    ? Buffer.isBuffer(thumbnail)
                      ? thumbnail
                      : await import("axios")
                          .then((a) =>
                            a.default.get(thumbnail, {
                              responseType: "arraybuffer",
                            }),
                          )
                          .then((r) => Buffer.from(r.data))
                          .catch(() => null)
                    : null,
                  renderLargerThumbnail: true,
                },
              },
              nativeFlowMessage: {
                messageParamsJson: JSON.stringify({
                  bottom_sheet: {
                    in_thread_buttons_limit: 2,
                    divider_indices: [1, 2, 999],
                  },
                }),
                buttons: [
                  {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🏠 Menu Utama",
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

    // fallback teks biasa jika button gagal
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
