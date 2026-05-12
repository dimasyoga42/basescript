import { config } from "../../config.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.note\s*/i, "").trim();

    if (!query) {
      const { data, error } = await supa
        .from("note")
        .select("id, note_name")
        .eq("grubId", m.chat)
        .order("id", { ascending: true });

      if (error) {
        console.error("[note][list]", error);

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
        text: `📒 Berikut daftar catatan yang tersimpan\n\nTotal: ${data.length} catatan`,
        footer: config.OwnerName || "Neurainc",
        buttons: [
          buildSelectButton(
            "Daftar Catatan",
            "Pilih salah satu catatan",
            data.map((item) => ({
              title: item.note_name,
              description: `Lihat detail catatan ${item.note_name}`,
              id: `.note ${item.note_name}`,
            })),
          ),
        ],
      });
    }

    const { data, error } = await supa
      .from("note")
      .select("id, note_name, isi, media")
      .eq("grubId", m.chat)
      .ilike("note_name", `%${query}%`)
      .order("id", { ascending: true })
      .limit(10);

    if (error) {
      console.error("[note][fetch]", error);

      return await sendText(conn, m.chat, "Gagal mengambil data catatan", m);
    }

    if (!data || data.length === 0) {
      return await sendText(
        conn,
        m.chat,
        `Catatan dengan nama "${query}" tidak ditemukan`,
        m,
      );
    }

    if (data.length > 1) {
      return await conn.sendButton(m.chat, {
        text: `Ditemukan ${data.length} catatan yang mirip dengan "${query}"`,
        footer: config.OwnerName || "Neurainc",
        buttons: [
          buildSelectButton(
            "Pilih Catatan",
            "Silahkan pilih salah satu",
            data.map((item) => ({
              title: item.note_name,
              description: `Lihat isi catatan ${item.note_name}`,
              id: `.note ${item.note_name}`,
            })),
          ),
        ],
      });
    }

    const note = data[0];

    const caption = `📒 *${note.note_name}*\n\n${note.isi}`;

    if (note.media) {
      return await conn.sendMessage(
        m.chat,
        {
          image: {
            url: `${note.media}?token=${process.DB_KEY}`,
          },
          caption,
        },
        {
          quoted: m,
        },
      );
    }

    await sendText(conn, m.chat, caption, m);
  } catch (err) {
    console.error("[note]", err);

    await sendText(
      conn,
      m.chat,
      config?.message?.error || "Terjadi kesalahan saat memproses permintaan",
      m,
    );
  }
};

handler.command = ["note"];
handler.category = "Menu Grub";
handler.submenu = "Note";

export default handler;
