import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { isAdmin, isBotadmin } from "../_function/_admin.js";

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    if (!(await isBotadmin(conn, m))) return;

    const text = m.text.split(" ").slice(1).join(" ").trim();

    const number = text.replace(/\D/g, "");

    if (!number) {
      return sendText(
        conn,
        m.chat,
        "Masukkan nomor yang ingin ditambahkan!",
        m,
      );
    }

    const jid = `${number}@s.whatsapp.net`;

    try {
      await conn.groupParticipantsUpdate(m.chat, [jid], "add");

      sendText(conn, m.chat, `Berhasil menambahkan ${number}`, m);
    } catch (err) {
      console.error(err);

      sendText(conn, m.chat, `Gagal menambahkan ${number}\n${err.message}`, m);
    }
  } catch (err) {
    console.error(err);

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail,
      m,
    });
  }
};

handler.command = "add";
handler.alias = ["tambah"];
handler.category = "Menu Admin";
handler.submenu = "Admin";

export default handler;
