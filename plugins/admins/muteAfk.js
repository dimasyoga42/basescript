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

    if (!data[groupId] || data[groupId].afk.length === 0)
      return sendText(
        conn,
        m.chat,
        `tidak ada user yang sedang AFK di grup ini`,
        m,
      );

    // Toggle mute grup
    data[groupId].mute = !data[groupId].mute;

    saveUserData(db, data);
    sendText(
      conn,
      m.chat,
      `notifikasi AFK telah di${data[groupId].mute ? "matikan (mute)" : "aktifkan (unmute)"} untuk grup ini`,
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
