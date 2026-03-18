import path from "path";
import fs from "fs";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { config } from "../../../config.js";
import { getUserData, saveUserData } from "../../../src/config/func.js";
import { sendText } from "../../../src/config/message.js";

const db = path.resolve("db", "profil.json");
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
    fs.writeFileSync(filePath, buffer);

    const data = await getUserData(db);
    let user = data.find((u) => u.userId === userId);

    if (!user) {
      data.push({ userId, bio: "", profilPath: filePath, idBuff: null });
    } else {
      if (user.profilPath && fs.existsSync(user.profilPath))
        fs.unlinkSync(user.profilPath);
      user.profilPath = filePath;
    }

    saveUserData(db, data);
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
