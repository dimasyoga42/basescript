import { getUserData, saveUserData } from "../../src/config/func.js";
import path from "path";
import { isAdmin } from "../_function/_admin.js";
const db_path = path.resolve("db", "mt.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const db = getUserData(db_path);
    let grubEntry = db.find((item) => item.id === m.chat);

    // FIX: jika belum ada entry, buat dulu dengan status false
    if (!grubEntry) {
      grubEntry = {
        id: m.chat,
        status: false,
      };
      db.push(grubEntry);
    }

    // FIX: toggle status
    grubEntry.status = !grubEntry.status;

    // FIX: simpan dulu sebelum kirim pesan
    saveUserData(db_path, db);

    // FIX: pesan menyesuaikan status hasil toggle
    const statusText = grubEntry.status
      ? "✅ Cron mt *dihidupkan*"
      : "🔴 Cron mt *dimatikan*";

    await conn.sendMessage(m.chat, { text: statusText }, { quoted: m });
  } catch (err) {
    console.error("[mt] Error:", err.message);
  }
};

handler.command = "cornmt";
handler.category = "Menu Admin";
export default handler;
