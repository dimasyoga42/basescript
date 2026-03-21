import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData } from "../../src/config/func.js";

const db = path.resolve("db", "warn.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const data = getUserData(db);
    const group = data.find((g) => g.id === m.chat);

    if (!group || !group.members.length)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: "Tidak ada data warn di grup ini.",
        msg: m,
      });

    const mentions = group.members.map((u) => u.id);
    const list = group.members
      .map((u, i) => `${i + 1}. @${u.id.split("@")[0]} - *${u.warn}/4*`)
      .join("\n");

    await conn.sendMessage(
      m.chat,
      {
        text: `LIST WARN\n${list}`,
        mentions,
      },
      { quoted: m },
    );
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["listwarn"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
