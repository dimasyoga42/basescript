import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const args = m.text.replace(/^\.setnote/i, "").split(",");
    const name = args[1]?.trim();
    const content = args.slice(2).join(",").trim();

    if (!name || !content)
      return sendText(
        conn,
        m.chat,
        "Invalid format\nExample: .setnote ,Title, note content here",
        m,
      );

    const { error } = await supa.from("note").insert({
      grubId: m.chat,
      note_name: name,
      isi: content,
    });

    if (error) return sendText(conn, m.chat, "Failed to save note", m);

    await sendText(conn, m.chat, "Note saved successfully", m);
  } catch (err) {
    console.error("[setnote]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["setnote"];
handler.category = "Menu Grub";
handler.submenu = "Note";
export default handler;
