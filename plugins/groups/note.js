import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(/^\.note\s*/i, "").trim();
    if (!name)
      return sendText(
        conn,
        m.chat,
        "Enter note title\nExample: .note My Title",
        m,
      );

    const { data, error } = await supa
      .from("note")
      .select("id, note_name, isi")
      .eq("grubId", m.chat)
      .ilike("note_name", `%${name}%`)
      .limit(1);

    if (error) return sendText(conn, m.chat, "Failed to fetch note", m);
    if (!data?.length) return sendText(conn, m.chat, "Note not found", m);

    const n = data[0];
    await sendText(conn, m.chat, `*${n.note_name}*\n\n${n.isi}`, m);
  } catch (err) {
    console.error("[note]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["note"];
handler.category = "Menu Grub";
handler.submenu = "Note";
export default handler;
