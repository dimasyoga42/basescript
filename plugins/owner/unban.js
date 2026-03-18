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
        "Tag a user to unban\nExample: .unban @user",
        m,
      );

    const target = mention[0];
    const data = await getUserData(db);
    const entry = data.find((e) => e.id === target);

    if (!entry?.ban?.length)
      return sendText(conn, m.chat, "User not found in database", m);

    const isBanned = entry.ban.some(
      (b) => b.userid === target && b.value === true,
    );
    if (!isBanned) return sendText(conn, m.chat, "This user is not banned", m);

    entry.ban = entry.ban.map((b) =>
      b.userid === target ? { ...b, value: false } : b,
    );

    await saveUserData(db, data);
    await conn.sendMessage(
      m.chat,
      {
        text: `@${target.split("@")[0]} has been unbanned`,
        mentions: [target],
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("[unban]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["unban"];
handler.category = "Menu Owner";
handler.submenu = "Admin";
export default handler;
