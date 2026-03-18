import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const { data, error } = await supa
      .from("note")
      .select("id, note_name")
      .eq("grubId", m.chat)
      .order("id", { ascending: true });

    if (error) return sendText(conn, m.chat, "Failed to fetch note list", m);
    if (!data?.length)
      return sendText(conn, m.chat, "No notes saved in this group", m);

    const list = data
      .map((i, n) => `${n + 1}. ${i.note_name} (${i.id})`)
      .join("\n");
    await sendText(conn, m.chat, `*NOTE LIST*\n\n${list}`, m);
  } catch (err) {
    console.error("[notelist]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["notelist"];
handler.category = "Menu Grub";
handler.submenu = "Note";
export default handler;
