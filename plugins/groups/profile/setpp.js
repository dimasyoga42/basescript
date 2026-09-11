import path from "path";
import fs from "fs";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { config } from "../../../config.js";
import { sendText } from "../../../src/config/message.js";
import { supa } from "../../../src/config/supa.js";

const profileDir = path.resolve("db", "profiles");
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const getUserId = (m) =>
  m.key.remoteJid.endsWith("@s.whatsapp.net")
    ? m.key.remoteJid
    : m.key.participant || m.key.remoteJid;

const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Groups Only", m);

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = m.message?.imageMessage || quoted?.imageMessage;

    if (!imageMessage)
      return sendText(
        conn,
        m.chat,
        "Send an image with the caption .setpp or reply to an image with .setpp",
        m,
      );

    const buffer = await downloadMediaMessage(
      { key: m.key, message: { imageMessage } },
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage },
    );

    const userId = getUserId(m);
    const fileName = `${userId.split("@")[0]}_${Date.now()}.jpg`;
    const filePath = path.join(profileDir, fileName);

    // ambil path lama dari Supabase (kalau ada) supaya file lama bisa dihapus
    const { data: existing } = await supa
      .from("profile")
      .select("profile_path")
      .eq("user_id", userId)
      .single();

    fs.writeFileSync(filePath, buffer);

    if (existing?.profile_path && fs.existsSync(existing.profile_path)) {
      fs.unlinkSync(existing.profile_path);
    }

    const { error } = await supa
      .from("profile")
      .upsert({ user_id: userId, profile_path: filePath }, { onConflict: "user_id" });

    if (error) throw error;

    await sendText(conn, m.chat, "Profile photo set successfully!", m);
  } catch (err) {
    console.error("[setpp]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["setpp"];
handler.category = "Menu Sosial";
handler.submenu = "Profil";
export default handler;
