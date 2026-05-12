import { downloadMediaMessage, getContentType } from "@whiskeysockets/baileys";

import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text.replace(/^(\.setnote|\.addnote)\s*/i, "").trim();

    const args = text.split("|");

    const name = args[0]?.trim();
    const content = args.slice(1).join("|").trim();

    if (!name || !content) {
      return await sendText(
        conn,
        m.chat,
        "Format salah\n\nGunakan:\n.setnote judul | isi catatan",
        m,
      );
    }

    const { data: existing, error: checkError } = await supa
      .from("note")
      .select("id")
      .eq("grubId", m.chat)
      .ilike("note_name", name)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("[setnote][check]", checkError);

      return await sendText(conn, m.chat, "Gagal memeriksa data catatan", m);
    }

    if (existing) {
      return await sendText(
        conn,
        m.chat,
        `Catatan dengan nama *${name}* sudah ada`,
        m,
      );
    }

    const quoted = m.quoted ? m.quoted : m;

    const messageType = getContentType(quoted.message || quoted.msg || {});

    let mediaBuffer = null;

    if (messageType === "imageMessage") {
      mediaBuffer = await downloadMediaMessage(
        quoted,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: conn.updateMediaMessage,
        },
      );
    }

    const { error } = await supa.from("note").insert({
      grubId: m.chat,
      note_name: name,
      isi: content,
      media: mediaBuffer,
    });

    if (error) {
      console.error("[setnote][insert]", error);

      return await sendText(conn, m.chat, "Gagal menyimpan catatan", m);
    }

    await sendText(conn, m.chat, `✅ Catatan *${name}* berhasil disimpan`, m);
  } catch (err) {
    console.error("[setnote]", err);

    await sendText(
      conn,
      m.chat,
      config?.message?.error || "Terjadi kesalahan saat memproses permintaan",
      m,
    );
  }
};

handler.command = ["setnote"];
handler.alias = ["addnote"];

handler.category = "Menu Grub";
handler.submenu = "Note";

export default handler;
