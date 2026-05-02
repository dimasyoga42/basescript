import axios from "axios";
import { PinSearch, PinSearchMenu } from "../_function/_pin.js";

const header = async (m, { conn }) => {
  try {
    const args = m.text
      .replace(/\.pin2/, "")
      .trim()
      .split(" ");
    const keyword = args[0];
    const jumlah = parseInt(args[1]);

    if (jumlah && [10, 20, 30, 40, 50].includes(jumlah)) {
      await PinSearch(conn, m, keyword, jumlah);
    } else {
      await PinSearchMenu(conn, m, keyword);
    }
  } catch (err) {
    console.error("[pin] error:", err.message);
    conn.sendMessage(
      m.chat,
      { text: `Terjadi kesalahan: ${err.message}` },
      { quoted: m },
    );
  }
};

header.command = "pin2";
header.category = "Menu Tools";
export default header;
