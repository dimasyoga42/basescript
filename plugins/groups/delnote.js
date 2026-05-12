import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.delnote\s*/i, "").trim();

    if (!query) {
      const { data, error } = await supa
        .from("note")
        .select("id, note_name")
        .eq("grubId", m.chat)
        .order("id", { ascending: true });

      if (error) {
        console.error("[delnote][list]", error);

        return await sendText(
          conn,
          m.chat,
          "Gagal mengambil daftar catatan",
          m,
        );
      }

      if (!data || data.length === 0) {
        return await sendText(
          conn,
          m.chat,
          "Belum ada catatan yang tersimpan di grup ini",
          m,
        );
      }

      return await conn.sendButton(m.chat, {
        text: `🗑️ Pilih salah satu catatan untuk dihapus\n\nTotal: ${data.length} catatan`,
        footer: config.OwnerName || "Neurainc",
        buttons: [
          buildSelectButton(
            "Hapus Catatan",
            "Pilih salah satu catatan",
            data.map((item) => ({
              title: item.note_name,
              description: `Hapus catatan ${item.note_name}`,
              id: `.delnote ${item.id}`,
            })),
          ),
        ],
      });
    }

    const isId = /^\d+$/.test(query);

    let noteQuery = supa
      .from("note")
      .select("id, note_name")
      .eq("grubId", m.chat);

    if (isId) {
      noteQuery = noteQuery.eq("id", query);
    } else {
      noteQuery = noteQuery.ilike("note_name", `%${query}%`);
    }

    const { data: notes, error: findError } = await noteQuery
      .order("id", { ascending: true })
      .limit(10);

    if (findError) {
      console.error("[delnote][find]", findError);

      return await sendText(conn, m.chat, "Gagal mencari catatan", m);
    }

    if (!notes || notes.length === 0) {
      return await sendText(
        conn,
        m.chat,
        `Catatan "${query}" tidak ditemukan`,
        m,
      );
    }

    if (notes.length > 1 && !isId) {
      return await conn.sendButton(m.chat, {
        text: `Ditemukan ${notes.length} catatan yang mirip dengan "${query}"`,
        footer: config.OwnerName || "Neurainc",
        buttons: [
          buildSelectButton(
            "Pilih Catatan",
            "Silahkan pilih catatan yang ingin dihapus",
            notes.map((item) => ({
              title: item.note_name,
              description: `Hapus catatan ${item.note_name}`,
              id: `.delnote ${item.id}`,
            })),
          ),
        ],
      });
    }

    const note = notes[0];

    const { error: deleteError } = await supa
      .from("note")
      .delete()
      .eq("grubId", m.chat)
      .eq("id", note.id);

    if (deleteError) {
      console.error("[delnote][delete]", deleteError);

      return await sendText(
        conn,
        m.chat,
        `Gagal menghapus catatan: ${deleteError.message}`,
        m,
      );
    }

    await sendText(
      conn,
      m.chat,
      `✅ Catatan *${note.note_name}* berhasil dihapus`,
      m,
    );
  } catch (err) {
    console.error("[delnote]", err);

    await sendText(
      conn,
      m.chat,
      config?.message?.error || "Terjadi kesalahan saat memproses permintaan",
      m,
    );
  }
};

handler.command = ["delnote"];
handler.category = "Menu Grub";
handler.submenu = "Note";

export default handler;
