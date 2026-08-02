// import axios from "axios"
// import { sendText } from "../../src/config/message.js"

// /**
//  * Fungsi untuk request langsung ke endpoint Llama 3.3 (hasil convert dari TS ke JS biasa)
//  * @param {string} prompt - system prompt
//  * @param {string} text - user text
//  */
// async function scrapeLlama33(prompt, text) {
//   try {
//     const payload = {
//       model: "meta-llama/Llama-3.3-70B-Instruct",
//       messages: [
//         { role: "system", content: prompt },
//         { role: "user", content: text },
//       ],
//       stream: false,
//     }

//     const headers = {
//       "Content-Type": "application/json",
//       "X-Deepinfra-Source": "web-page",
//       accept: "text/event-stream",
//       "User-Agent":
//         "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
//       Referer: "https://deepinfra.com/chat",
//     }

//     const response = await axios.post(
//       "https://api.deepinfra.com/v1/openai/chat/completions",
//       payload,
//       { headers }
//     )

//     return response.data.choices[0].message.content
//   } catch (error) {
//     console.error("API Error:", error.message)
//     throw new Error(
//       error.response ? error.response.data.error : "Failed to get response from Llama 3.3 API"
//     )
//   }
// }

// const handler = async (m, { conn }) => {
//   const texts = m.text.replace(/\.ai/, "").trim()
//   if (!texts) {
//     throw `Contoh: .ai Halo, siapa kamu?`
//   }
//   try {
//     conn.sendMessage(m.chat, { text: "sedang berfikir" }, { quoted: m })

//     const result = await scrapeLlama33(
//       "Kamu adalah Neura, asisten AI yang ramah, santai, dan membantu. Jawab dalam Bahasa Indonesia yang jelas.",
//       texts
//     )

//     if (!result) {
//       return sendText(conn, m.chat, "❌ Neura tidak memberikan jawaban.", m)
//     }
//     await sendText(conn, m.chat, result, m)
//   } catch (e) {
//     console.error("AI Handler Error:", e.message)
//     await sendText(conn, m.chat, "⚠️ Terjadi kesalahan saat menghubungi Neura AI. Coba lagi nanti.", m)
//   }
// }

// handler.category = "Menu AI"
// handler.command = "ai"

// export default handler
