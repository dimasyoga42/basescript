import { getUserData, saveUserData } from "../../src/config/func.js";
import path from "path";
import { isAdmin } from "../_function/_admin.js";
const db_path = path.resolve("db", "live.json");

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
      ? "✅ Cron live *dihidupkan*"
      : "🔴 Cron live *dimatikan*";

    await conn.sendMessage(m.chat, { text: statusText }, { quoted: m });
  } catch (err) {
    console.error("[live] Error:", err.message);
  }
};

handler.command = "cornlive";
handler.category = "Menu Admin";
export default handler;
