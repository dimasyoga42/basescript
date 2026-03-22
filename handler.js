import { config } from "./config.js";
import { checkUnAfk } from "./plugins/_function/_afk.js";
import { isBan } from "./plugins/_function/_ban.js";
import { isMuted } from "./plugins/_function/_muted.js";
import { checkVip, cleanExpiredVip } from "./plugins/_function/_vip.js";

function isMatch(pattern, command) {
  if (!pattern) return false;
  if (typeof pattern === "string") return pattern === command;
  if (Array.isArray(pattern)) return pattern.includes(command);
  if (pattern instanceof RegExp) return pattern.test(command);
  return false;
}

// ✅ Ekstrak teks dari berbagai jenis pesan termasuk button response
function extractBody(m) {
  const msg = m.message;
  if (!msg) return "";

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    // ✅ Button quick_reply response
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    // ✅ Interactive button response (nativeFlowMessage)
    msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    "" ||
    // ✅ List response
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    // ✅ Template button response
    msg.templateButtonReplyMessage?.selectedId ||
    ""
  );
}

export async function runCommand(conn, m, plugins) {
  const prefix = config.prefix;
  const body = extractBody(m);

  if (!body) return;

  // Cek apakah body dimulai dengan prefix
  // Button response langsung pakai id seperti ".menu" jadi tetap perlu prefix
  if (!body.startsWith(prefix)) return;

  if (isMuted(m)) return;
  if (await isBan(conn, m)) return;
  cleanExpiredVip();

  const input = body.slice(prefix.length).trim();
  const [command, ...args] = input.split(/\s+/);
  const text = args.join(" ");

  // Log button response untuk debug
  const isButtonResponse =
    m.message?.buttonsResponseMessage ||
    m.message?.interactiveResponseMessage ||
    m.message?.listResponseMessage ||
    m.message?.templateButtonReplyMessage;

  if (isButtonResponse) {
    console.log(`[Button] ${m.sender} → ${body}`);
  }

  for (const name in plugins) {
    const plugin = plugins[name];
    if (!plugin) continue;

    const matched =
      isMatch(plugin.command, command) || isMatch(plugin.alias, command);
    if (!matched) continue;

    try {
      await plugin(m, { conn, args, text, command });
    } catch (err) {
      console.error(`[runCommand] Error pada plugin "${name}":`, err);
    }
    return;
  }
}

export async function runEvent(conn, event, plugins) {
  for (const name in plugins) {
    const plugin = plugins[name];
    if (!plugin) continue;
    if (plugin.on !== event.type) continue;
    try {
      await plugin(event, { conn });
    } catch (err) {
      console.error(`Error event plugin "${name}":`, err);
    }
  }
}
