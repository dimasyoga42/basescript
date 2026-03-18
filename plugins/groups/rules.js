import path from "path";
import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { getUserData } from "../../src/config/func.js";
const db = path.resolve("db", "rules.json");

const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group only", m);

    const data = await getUserData(db);
    const group = Array.isArray(data) && data.find((i) => i.id === m.chat);

    if (!group?.rules)
      return sendText(
        conn,
        m.chat,
        "No rules set\nUse .setrules to add rules",
        m,
      );

    await sendText(conn, m.chat, `*GROUP RULES*\n\n${group.rules}`, m);
  } catch (err) {
    console.error("[rules]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["rules"];
handler.category = "Menu Grub";
handler.submenu = "Grub";
export default handler;
