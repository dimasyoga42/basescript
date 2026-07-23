import { getUserData, saveUserData } from "../../src/config/func.js";
import { sendText } from "../../src/config/message.js";
import path from "path";

const db = path.resolve("db", "packname.json");

const handler = (m, { conn }) => {
  try {
    const [pack, author] = m.text.replace(/\.setwm/, "").split("|").map((v) => v.trim());

    if (!pack || !author) {
      return sendText(
        conn,
        m.chat,
        "Format anda salah.\n\nGunakan:\n.setwm packname | author",
        m,
      );
    }

    const data = getUserData(db);

    const dataPack = data.find((item) => item.id === m.chat);

    if (dataPack) {
      dataPack.pack = pack;
      dataPack.author = author;
    } else {
      data.push({
        id: m.chat,
        pack,
        author,
      });
    }

    saveUserData(db, data);

    return sendText(
      conn,
      m.chat,
      `WM stiker berhasil diubah.\n\nPackname: ${pack}\nAuthor: ${author}`,
      m,
    );
  } catch (err) {
    console.error(err);
    return sendText(
      conn,
      m.chat,
      "Terjadi kesalahan saat menyimpan WM stiker.",
      m,
    );
  }
};

handler.command = "setwm";
handler.category = "Menu Tools"
export default handler;
