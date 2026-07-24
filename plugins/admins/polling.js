import { sendText } from "../../src/config/message.js"
import { isAdmin } from "../_function/_admin.js"

const handler = async (m, { conn }) => {
  try {
    if (!isAdmin(conn, m)) return

    const text = m.text.replace(/^\.poll\s*/i, "").trim()
    if (!text) {
      return sendText(
        conn,
        m.chat,
        "Masukan nama dan value polling\n\nContoh:\n.poll Pertanyaan|Opsi1|Opsi2|Opsi3",
        m
      )
    }

    const val = text.split("|").map(v => v.trim()).filter(v => v.length)

    if (val.length < 3) {
      return sendText(
        conn,
        m.chat,
        "Minimal harus ada 1 pertanyaan dan 2 opsi jawaban\n\nContoh:\n.poll Pertanyaan|Opsi1|Opsi2",
        m
      )
    }

    const [question, ...options] = val

    if (options.length > 12) {
      return sendText(conn, m.chat, "Maksimal 12 opsi jawaban polling", m)
    }

    await conn.sendMessage(
      m.chat,
      {
        poll: {
          name: question,
          values: options,
          selectableCount: 1
        }
      },
      { quoted: m }
    )
  } catch (err) {
    console.error(err)
    sendText(conn, m.chat, "Terjadi kesalahan saat membuat polling", m)
  }
}

handler.category = "Menu Admin"
handler.command = /^poll$/i

export default handler
