import axios from "axios"
import { sendText } from "../../src/config/message.js"
/**
 * Fungsi untuk request langsung ke endpoint chatbot (hasil convert dari TS ke JS biasa)
 * @param {Array<{role: "system"|"user"|"assistant", content: string}>} messages
 */
async function scrapeGpt3(messages) {
  try {
    const response = await axios.post(
      "https://chatbot-ji1z.onrender.com/chatbot-ji1z",
      { messages },
      {
        timeout: 30000,
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          origin: "https://seoschmiede.at",
        },
      }
    )

    return JSON.parse(
      JSON.stringify(response.data.choices[0].message.content, null, 2)
    )
  } catch (error) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get response from API")
  }
}

const handler = async (m, { conn }) => {
  const texts = m.text.replace(/\.ai/, "").trim();
  if (!texts) {
    throw `Contoh: .ai Halo, siapa kamu?`
  }

  try {
    conn.sendMessage(m.chat, {text: "sedang berfikir"}, {quoted:m})

    const result = await scrapeGpt3([
      {
        role: "system",
        content:
          "Kamu adalah Neura, asisten AI yang ramah, santai, dan membantu. Jawab dalam Bahasa Indonesia yang jelas.",
      },
      { role: "user", content: texts },
    ])

    if (!result) {
      return sendText(conn, m.chat, "❌ Neura tidak memberikan jawaban.", m)
    }

    await sendText(conn, m.chat, result, m)
  } catch (e) {
    console.error("AI Handler Error:", e.message)
    await sendText(conn, m.chat, "⚠️ Terjadi kesalahan saat menghubungi Neura AI. Coba lagi nanti.", m)
  }
}


handler.category = "Menu AI"
handler.command = "ai"

export default handler
