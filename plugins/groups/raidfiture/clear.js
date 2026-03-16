import { config, thumbnail } from "../../../config.js";
import { getUserData, saveUserData } from "../../../src/config/func.js";
import { sendFancyText, sendText } from "../../../src/config/message.js";
import path from "path";
import { isAdmin } from "../../_function/_admin.js";

const db = path.resolve("db", "raid.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const data = await getUserData(db);
    const index = data.findIndex((item) => item.id === m.chat);

    if (index === -1)
      return sendText(conn, m.chat, "Tidak ada raid aktif di grup ini", m);

    data.splice(index, 1);
    await saveUserData(db, data);
    await sendText(conn, m.chat, "Raid berhasil dibubarkan", m);
  } catch (err) {
    console.error(err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["clearraid"];
handler.category = "Toram Raid";
handler.submenu = "Raid";
export default handler;
