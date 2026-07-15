import { getUserData, saveUserData } from "../../src/config/func.js";
import path from "path";
import { isAdmin } from "../_function/_admin.js";

const db_path = path.resolve("db", "code.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const db = getUserData(db_path);
    let grubEntry = db.find((item) => item.id === m.chat);

    // Jika belum ada entry, buat dulu dengan status false
    if (!grubEntry) {
      grubEntry = {
        id: m.chat,
        status: false,
      };
      db.push(grubEntry);
    }

    // Toggle status
    grubEntry.status = !grubEntry.status;

    // Simpan dulu sebelum kirim pesan
    saveUserData(db_path, db);

    // Pesan menyesuaikan status hasil toggle
    const statusText = grubEntry.status
      ? "✅ Cron code *dihidupkan*"
      : "🔴 Cron code *dimatikan*";

    await conn.sendMessage(m.chat, { text: statusText }, { quoted: m });
  } catch (err) {
    console.error("[code] Error:", err.message);
  }
};

handler.command = "corncode";
handler.category = "Menu Admin";
export default handler;
