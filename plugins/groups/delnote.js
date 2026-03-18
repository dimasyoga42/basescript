import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const id = m.text.split(" ")[1];
    if (!id)
      return sendText(conn, m.chat, "Enter note ID\nExample: .delnote 3", m);

    const { error, count } = await supa
      .from("note")
      .delete()
      .eq("grubId", m.chat)
      .eq("id", id)
      .select("*", { count: "exact", head: true });

    if (error)
      return sendText(conn, m.chat, `Failed to delete: ${error.message}`, m);
    if (count === 0)
      return sendText(conn, m.chat, `Note with ID ${id} not found`, m);

    await sendText(conn, m.chat, `Note with ID ${id} deleted successfully`, m);
  } catch (err) {
    console.error("[delnote]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["delnote"];
handler.category = "Menu Grub";
handler.submenu = "Note";
export default handler;
