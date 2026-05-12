import { downloadMediaMessage, getContentType } from "@whiskeysockets/baileys";

import fs from "fs";

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

    const { data: existing } = await supa
      .from("note")
      .select("id")
      .eq("grubId", m.chat)
      .ilike("note_name", name)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return await sendText(
        conn,
        m.chat,
        `Catatan dengan nama *${name}* sudah ada`,
        m,
      );
    }

    const messageType = getContentType(m.message);

    let mediaUrl = null;

    if (messageType === "imageMessage") {
      const buffer = await downloadMediaMessage(
        m,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: conn.updateMediaMessage,
        },
      );

      const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

      const fileName = `${Date.now()}-${safeName}.jpg`;

      const filePath = `note/${m.chat}/${fileName}`;

      const { error: uploadError } = await supa.storage
        .from("note")
        .upload(filePath, buffer, {
          upsert: false,
          cacheControl: "3600",
          contentType: "image/jpeg",
        });

      if (uploadError) {
        console.error("[setnote][upload]", uploadError);

        return await sendText(conn, m.chat, "Gagal upload gambar catatan", m);
      }

      const { data: publicData } = supa.storage
        .from("note")
        .getPublicUrl(filePath);

      mediaUrl = publicData.publicUrl;
    }

    const { error } = await supa.from("note").insert({
      grubId: m.chat,
      note_name: name,
      isi: content,
      media: mediaUrl,
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
