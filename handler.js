import { config } from "./config.js";
import { isMuted } from "./plugins/_function/_muted.js";

export async function runCommand(conn, m, plugins) {
  const prefix = config.prefix;

  // detect text atau caption (gambar/video/dokumen)
  const body =
    m.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.documentMessage?.caption ||
    "";

  if (!body || !body.startsWith(prefix)) return;
  if (isMuted(m)) return;
  const input = body.slice(prefix.length).trim();
  const [command, ...args] = input.split(/\s+/);
  const text = args.join(" ");

  for (const name in plugins) {
    const plugin = plugins[name];
    if (!plugin) continue;

    const cmds = plugin.command;
    if (!cmds) continue;

    const match =
      typeof cmds === "string"
        ? cmds === command
        : Array.isArray(cmds)
          ? cmds.includes(command)
          : cmds instanceof RegExp
            ? cmds.test(command)
            : false;

    if (!match) continue;

    try {
      await plugin(m, { conn, args, text, command });
    } catch (err) {
      console.error(`Error pada plugin "${name}":`, err);
    }
    return;
  }
}
