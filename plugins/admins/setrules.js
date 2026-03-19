import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "rules.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group only", m);

    const text = m.text.replace(/^\.setrules/, "").trim();
    if (!text)
      return sendText(
        conn,
        m.chat,
        "Invalid format\nExample: .setrules No spam, be respectful",
        m,
      );

    let data = await getUserData(db);
    if (!Array.isArray(data)) data = [];

    const index = data.findIndex((i) => i.id === m.chat);
    if (index !== -1) {
      data[index].rules = text;
    } else {
      data.push({ id: m.chat, rules: text });
    }

    await saveUserData(db, data);
    await sendText(conn, m.chat, "Rules updated successfully", m);
  } catch (err) {
    console.error("[setrules]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["setrules"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
