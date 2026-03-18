import { config } from "./config.js";
import { checkUnAfk } from "./plugins/_function/_afk.js";
import { isBan } from "./plugins/_function/_ban.js";
import { isMuted } from "./plugins/_function/_muted.js";
import { checkVip, cleanExpiredVip } from "./plugins/_function/_vip.js";

/**
 * Helper: cek apakah command cocok dengan pattern plugin
 * @param {string|string[]|RegExp|undefined} pattern - plugin.command atau plugin.alias
 * @param {string} command - command yang diketik user
 * @returns {boolean}
 */
function isMatch(pattern, command) {
  if (!pattern) return false;
  if (typeof pattern === "string") return pattern === command;
  if (Array.isArray(pattern)) return pattern.includes(command);
  if (pattern instanceof RegExp) return pattern.test(command);
  return false;
}

/**
 * Jalankan command dari pesan masuk
 * @param {object} conn    - koneksi WhatsApp
 * @param {object} m       - objek pesan
 * @param {object} plugins - kumpulan plugin yang sudah di-load
 */
export async function runCommand(conn, m, plugins) {
  const prefix = config.prefix;

  // Ambil teks dari berbagai tipe pesan (teks, caption gambar/video/dokumen)
  const body =
    m.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.documentMessage?.caption ||
    "";

  if (!body || !body.startsWith(prefix)) return;

  if (isMuted(m)) return;

  if (await isBan(conn, m)) return;

  cleanExpiredVip();

  const input = body.slice(prefix.length).trim();
  const [command, ...args] = input.split(/\s+/);
  const text = args.join(" ");

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
