import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";
import { sendText } from "../../src/config/message.js";
import { isAdmin } from "../_function/_admin.js";

const db = path.resolve("db", "afk.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const data = getUserData(db);
    const groupId = m.chat;

    const groupAfkUsers = data.filter((user) => user.grubId === groupId);

    if (groupAfkUsers.length === 0) {
      return sendText(
        conn,
        m.chat,
        `tidak ada user yang sedang AFK di grup ini`,
        m,
      );
    }

    // Cek status mute saat ini (ambil dari user pertama sebagai referensi)
    const currentMute = groupAfkUsers[0].mute;
    const newMute = !currentMute;

    // Toggle mute untuk semua user AFK di grup ini
    const updatedData = data.map((user) => {
      if (user.grubId === groupId) {
        return { ...user, mute: newMute };
      }
      return user;
    });

    saveUserData(db, updatedData);

    sendText(
      conn,
      m.chat,
      `notifikasi AFK untuk semua user di grup ini telah di${newMute ? "matikan (mute)" : "aktifkan (unmute)"}`,
      m,
    );
  } catch (err) {
    console.error("[notify]", err);
  }
};

handler.command = ["notify"];
handler.category = "Menu Sosial";
handler.submenu = "Sosial";
export default handler;
