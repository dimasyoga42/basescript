import path from "path";
import { config } from "../../../config.js";
import { getUserData, saveUserData } from "../../../src/config/func.js";
import { sendText } from "../../../src/config/message.js";

const db = path.resolve("db", "profil.json");

const getUserId = (m) =>
  m.key.remoteJid.endsWith("@s.whatsapp.net")
    ? m.key.remoteJid
    : m.key.participant || m.key.remoteJid;

const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group Only", m);

    const text = m.text.replace(/^\.setdesc\s*/i, "").trim();

    if (!text)
      return sendText(
        conn,
        m.chat,
        "Enter bio description\nExample: .setdesc Student | Coding",
        m,
      );

    if (text.length > 500)
      return sendText(conn, m.chat, `Bio is too long (${text.length}/500)`, m);

    const userId = getUserId(m);
    const data = await getUserData(db);
    let user = data.find((u) => u.userId === userId);

    if (!user) {
      data.push({ userId, bio: text, profilPath: null, idBuff: null });
    } else {
      user.bio = text;
    }

    saveUserData(db, data);
    await sendText(conn, m.chat, "Bio updated successfully!", m);
  } catch (err) {
    console.error("[setdesc]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["setdesc"];
handler.category = "Menu Sosial";
handler.submenu = "Profil";
export default handler;
