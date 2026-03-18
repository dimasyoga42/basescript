import path from "path";
import { isOwner } from "../_function/_ban.js";
import { sendText } from "../../src/config/message.js";
import { getUserData, saveUserData } from "../../src/config/func.js";
import { config } from "../../config.js";

const db = path.resolve("db", "banned.json");

const handler = async (m, { conn }) => {
  try {
    if (!isOwner(conn, m)) return;
    const mention = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mention || mention.length === 0)
      return sendText(
        conn,
        m.chat,
        "Tag a user to ban\nExample: .ban @user",
        m,
      );

    const target = mention[0];
    const data = await getUserData(db);

    const already = data.find((e) =>
      e.ban?.some((b) => b.userid === target && b.value === true),
    );
    if (already)
      return conn.sendMessage(
        m.chat,
        {
          text: `@${target.split("@")[0]} is already banned`,
          mentions: [target],
        },
        { quoted: m },
      );

    let entry = data.find((e) => e.id === target);
    if (!entry) {
      entry = { id: target, ban: [] };
      data.push(entry);
    }

    entry.ban.push({
      userid: target,
      value: true,
      timestamp: new Date().toISOString(),
      bannedBy: m.key.participant || m.key.remoteJid || "unknown",
    });

    await saveUserData(db, data);
    await conn.sendMessage(
      m.chat,
      {
        text: `@${target.split("@")[0]} has been banned`,
        mentions: [target],
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("[ban]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["ban"];
handler.category = "Menu Owner";
handler.submenu = "Admin";
export default handler;
