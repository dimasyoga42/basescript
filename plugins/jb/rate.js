import { getUserData, saveUserData } from "../../src/config/func.js"
import path from "path"
import { isAdmin } from "../_function/_admin.js";
const db = path.resolve("db", "rate.json")
const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const vel = m.text.replace(/\.setrate/i, "").trim()
    if (!vel) {
      return conn.sendMessage(
        m.chat,
        { text: "rate harus di isi tidak boleh kosong gunakan .setrate 100-150" },
        { quoted: m }
      )
    }
    if (!/^\d+-\d+$/.test(vel)) {
      return conn.sendMessage(
        m.chat,
        { text: "format salah, gunakan contoh: .setrate 100-150" },
        { quoted: m }
      )
    }
    let data =  getUserData(db)
    let dataentry = data.find((i) => i.id === m.chat)
    if (!dataentry) {
      dataentry = {
        id: m.chat,
        rate: vel,
      }
      data.push(dataentry)
    } else {
      dataentry.rate = vel
    }
    saveUserData(db, data)
    return conn.sendMessage(
      m.chat,
      { text: `rate berhasil diatur ke *${vel}*` },
      { quoted: m }
    )
  } catch (err) {
    console.log(err)
    return conn.sendMessage(
      m.chat,
      { text: "terjadi kesalahan dalam memperbarui database" },
      { quoted: m }
    )
  }
}
handler.command = "setrate"
handler.category = "Menu Jb"
handler.alias = "srate"
export default handler
