import { getUserData, saveUserData } from "../../src/config/func.js";
import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendMenu } from "../../src/config/message.js";

const db_path = path.resolve("db", "live.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const db = getUserData(db_path);
    let grubEntry = db.find((item) => item.id === m.chat);

    if (!grubEntry) {
      grubEntry = {
        id: m.chat,
        status: false,
      };
      db.push(grubEntry);
      conn.sendMessage(m.chat, { text: `corn live dihidupkan` }, { quoted: m });
    }
    grubEntry.status = !grubEntry.status;
    conn.sendMessage(m.chat, { text: `corn live dimatikan` }, { quoted: m });
    saveUserData(db_path, db);
  } catch (err) {
    console.error("[live] Error:", err.message);
  }
};

handler.command = "cornlive";
handler.category = "Menu Admin";
export default handler;
