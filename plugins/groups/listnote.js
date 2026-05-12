import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const { data: db, error } = await supa
      .from("note")
      .select("id, note_name")
      .eq("grubId", m.chat)
      .order("id", { ascending: true });

    if (error) return sendText(conn, m.chat, "Failed to fetch note list", m);
    if (!db?.length)
      return sendText(conn, m.chat, "No notes saved in this group", m);

    await conn.sendButton(m.chat, {
      text: "berikut adalah catanan yang tersimpan",
      footer: "Neurainc",
      buttons: [
        buildSelectButton(
          "Catatan",
          "Pilih salah satu untuk melihat",
          db.map((item) => ({
            title: item.note_name,
            description: `lihat detail catatan ${item.note_name}`,
            id: `.note ${item.note_name}`,
          })),
        ),
      ],
    });
  } catch (err) {
    console.error("[notelist]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["notelist"];
handler.category = "Menu Grub";
handler.submenu = "Note";
export default handler;
