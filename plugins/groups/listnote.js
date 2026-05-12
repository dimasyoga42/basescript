import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const { data, error } = await supa
      .from("note")
      .select("id, note_name")
      .eq("grubId", m.chat)
      .order("id", { ascending: true });

    if (error) {
      console.error("[notelist][supabase]", error);
      return await sendText(conn, m.chat, "Gagal mengambil daftar catatan", m);
    }

    if (!data || data.length === 0) {
      return await sendText(
        conn,
        m.chat,
        "Belum ada catatan yang tersimpan di grup ini",
        m,
      );
    }

    const rows = data.map((item) => ({
      title: item.note_name,
      description: `Lihat detail catatan ${item.note_name}`,
      id: `.note ${item.note_name}`,
    }));

    await conn.sendButton(m.chat, {
      text: `📒 Berikut daftar catatan yang tersimpan\n\nTotal: ${data.length} catatan`,
      footer: config.OwnerName || "Neurainc",
      buttons: [
        buildSelectButton("Daftar Catatan", "Pilih salah satu catatan", rows),
      ],
    });
  } catch (err) {
    console.error("[notelist]", err);

    await sendText(
      conn,
      m.chat,
      config?.message?.error || "Terjadi kesalahan saat memproses permintaan",
      m,
    );
  }
};

handler.command = ["notelist"];
handler.category = "Menu Grub";
handler.submenu = "Note";

export default handler;
