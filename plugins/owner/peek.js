import { getUserData } from "../../src/config/func.js";
import { buildSelectButton, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const raw = m.text.replace(/\.(addevent|setevent)\s*/gi, "").trim();
    const query = raw.split(/\s+/);
    const db = supa.from("bospeek");

    if (!raw) {
      const { data: peek, error } = await db.select("name");
      if (error)
        return sendText(conn, m.chat, "Gagal mengambil data bospeek", m);

      return conn.sendButton(m.chat, {
        text: "Silahkan pilih bos peek yang akan di aktifkan",
        footter: "Neurainc",
        buttons: buildSelectButton(
          "Panel Owner",
          "Silahkan pilih bos peek yang aktif",
          peek.map((item) => ({
            title: item.name,
            description: `Aktifkan ${item.name}`,
            id: `.addevent type=edit ${item.name}`,
          })),
        ),
      });
    }
    if (query[0] === "type=edit") {
      const namaPeek = query[1];
      if (!namaPeek) return sendText(conn, m.chat, "Masukan nama bos peek", m);

      // Cek apakah data ada
      const { data: dataPeek, error: errSelect } = await supa
        .from("bospeek")
        .select("name, active, element")
        .eq("name", namaPeek)
        .single();

      if (errSelect || !dataPeek) {
        return sendText(
          conn,
          m.chat,
          `Bos peek "${namaPeek}" tidak ditemukan`,
          m,
        );
      }

      if (dataPeek.active) {
        return sendText(conn, m.chat, `Bos peek "${namaPeek}" sudah aktif`, m);
      }

      await supa
        .from("bospeek")
        .update({ active: false })
        .neq("name", namaPeek);

      const { error: errUpdate } = await supa
        .from("bospeek")
        .update({ active: true })
        .eq("name", namaPeek);

      if (errUpdate)
        return sendText(conn, m.chat, "Gagal mengaktifkan bos peek", m);

      return sendText(
        conn,
        m.chat,
        `Bos peek "${namaPeek}" berhasil diaktifkan`,
        m,
      );
    }
  } catch (err) {
    console.error(err);
    return sendText(conn, m.chat, "Terjadi kesalahan pada server", m);
  }
};

handler.command = "addevent";
handler.alias = ["setevent"];
handler.category = "Menu Owner";
export default handler;
