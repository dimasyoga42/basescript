import { supa } from "../../src/config/supa.js";
import { isAdmin } from "../_function/_admin.js";
//import { supabase } from "../../src/model/supabase.js";

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const text = m.text || "";
    const arg = text.replace(".setwc", "").trim();

    if (!arg) {
      return conn.sendMessage(
        m.chat,
        {
          text: `Format salah!

Gunakan:
.setwc teks

Tag:
@user = tag user
@nama = nama user
@group = nama grup
@count = jumlah member
@desc = deskripsi grup`,
        },
        { quoted: m },
      );
    }

    const { error } = await supa.from("wellcome").upsert(
      {
        id_grub: m.chat,
        message: arg,
      },
      { onConflict: "id_grub" },
    );

    if (error) throw error;

    return conn.sendMessage(
      m.chat,
      {
        text: "Welcome message berhasil disimpan",
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("SETWC ERROR:", err);
    return conn.sendMessage(
      m.chat,
      {
        text: "Gagal menyimpan welcome message",
      },
      { quoted: m },
    );
  }
};

handler.command = "setwc";
handler.category = "Menu Admin";

export default handler;
