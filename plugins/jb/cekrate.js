import { getUserData, saveUserData } from "../../src/config/func.js"
import path from "path"
const db = path.resolve("db", "rate.json")
const handler = async (m, {conn}) => {
  try {
    let data = await getUserData(db, (item) => item.id === m.chat)
    if (!data || !data.rate) {
      return conn.sendMessage(m.chat, { text: "belum ada rate spina yang di set di chat ini, gunakan .setrate 100-150" }, { quoted: m })
    }
    return conn.sendMessage(m.chat, { text: `rate saat ini: *${data.rate}M*` }, { quoted: m })
  } catch (err) {
    return conn.sendMessage(m.chat, {text: "terjadi kesalahan dalam mengambil database"}, {quoted: m})
  }
}
handler.command = "cakrate"
handler.category = "Menu Jb"
handler.alias = "ceckrate"
export default handler
