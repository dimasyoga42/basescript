import { config } from "../../../config.js";
import { sendText } from "../../../src/config/message.js";
import { supa } from "../../../src/config/supa.js";

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
        "Enter bio description\nExample: .setdesc any",
        m,
      );

    if (text.length > 500)
      return sendText(conn, m.chat, `Bio is too long (${text.length}/500)`, m);

    const userId = getUserId(m);

    const { error } = await supa
      .from("profile")
      .upsert({ user_id: userId, bio: text }, { onConflict: "user_id" });

    if (error) throw error;

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
