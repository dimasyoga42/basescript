import { config } from "./config.js";
import { checkUnAfk } from "./plugins/_function/_afk.js";
import { isBan } from "./plugins/_function/_ban.js";
import { isMuted } from "./plugins/_function/_muted.js";
import { checkVip, cleanExpiredVip } from "./plugins/_function/_vip.js";
import { checkGroupLimit } from "./src/config/limit.js";

function isMatch(pattern, command) {
  if (!pattern) return false;
  if (typeof pattern === "string") return pattern === command;
  if (Array.isArray(pattern)) return pattern.includes(command);
  if (pattern instanceof RegExp) return pattern.test(command);
  return false;
}

function extractBody(m) {
  const msg = m.message;
  if (!msg) return "";

  let interactiveId = "";
  const params =
    msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

  if (params) {
    try {
      const parsed = JSON.parse(params);
      interactiveId = parsed.id || "";
    } catch {
      interactiveId = "";
    }
  }

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    interactiveId ||
    ""
  );
}

export async function runCommand(conn, m, plugins) {
  const prefix = config.prefix;
  const body = extractBody(m);

  if (!body) return;
  if (!body.startsWith(prefix)) return;
  if (!m.chat?.endsWith("@g.us")) return;
  if (isMuted(m)) return;
  if (await isBan(conn, m)) return;

  const input = body.slice(prefix.length).trim();
  const [command, ...args] = input.split(/\s+/);
  const text = args.join(" ");

  // 🔥 command whitelist (tidak butuh VIP)
  const noVipCmd = ["cekvip", "setvip", "menu"];

  // 🔥 bypass owner
  const isOwner = config.OwnerName?.includes(m.sender);

  // 🔥 clean VIP (tidak setiap message)
  if (Math.random() < 0.02) cleanExpiredVip(); // 2% chance

  // 🔥 cek VIP hanya jika bukan whitelist & bukan owner
  if (!noVipCmd.includes(command) && !isOwner) {
    const isVip = checkVip(m.chat);

    if (!isVip) {
      return conn.sendMessage(
        m.chat,
        {
          text: "Grup belum VIP.\nHubungi owner:\n085664393331 (dimas)",
        },
        { quoted: m }
      );
    }
  }

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
