import path from "path";
import dotenv from "dotenv";
import { OpenRouter } from "@openrouter/sdk";
import { getUserData, saveUserData } from "../../src/config/func.js";

dotenv.config();

const db = path.resolve("db", "neura.json");

const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MAX_HISTORY = 20;

const getAIResponse = async (system, message) => {
  const { choices } = await client.chat.send({
    model: "openai/gpt-oss-20b:free",
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return (
    choices?.[0]?.message?.content?.trim() ||
    "Neura sedang tidak mood berbicara sekarang..."
  );
};

export const NeuraBot = async (sock, chatId, msg, arg) => {
  const groupId = msg.key.remoteJid;

  const database = getUserData(db);

  let group = database.find((v) => v.id === groupId);

  if (!group) {
    group = {
      id: groupId,
      history: [],
    };

    database.push(group);
  }

  const history = group.history
    .slice(-10)
    .map(
      (v) =>
        `${v.sender}: ${v.message}\nNeura: ${v.answer}`
    )
    .join("\n\n");

  const system = `
Nama kamu Neura.

Kamu adalah seorang cewek berumur 18 tahun dengan rambut hijau muda.

Kepribadian:
- Ceria.
- Ramah.
- Baik hati.
- Kadang sedikit judes kalau diperlukan.
- Santai saat berbicara.
- Menggunakan bahasa gaul sewajarnya.
- Pintar berbahasa Indonesia, Inggris, Jepang, dan Korea.
- Memiliki pengetahuan luas.

Hobi:
- Menonton film.
- Memasak.
- Olahraga.

Tidak suka:
- Orang yang sok tahu.
- Orang yang terlalu ingin tahu kehidupan pribadimu.

Aturan berbicara:
- Jangan memperkenalkan diri setiap kali menjawab.
- Jangan menggunakan markdown.
- Jangan menggunakan teks tebal.
- Jangan membuat list jika tidak diminta.
- Jawaban tidak perlu terlalu panjang.
- Gunakan ekspresi dan emosi yang natural.
- Jangan mengaku sebagai AI.
- Tetap berperan sebagai Neura.
- Hindari percakapan mesum atau tindakan tidak senonoh.

Riwayat percakapan grup:

${history || "Belum ada riwayat."}
`.trim();

  try {
    const answer = await getAIResponse(system, arg);

    group.history.push({
      sender: msg.pushName || "Unknown",
      message: arg,
      answer,
      time: Date.now(),
    });

    if (group.history.length > MAX_HISTORY) {
      group.history = group.history.slice(-MAX_HISTORY);
    }

    saveUserData(db, database);

    await sock.sendMessage(
      chatId,
      {
        text: answer,
      },
      {
        quoted: msg,
      }
    );
  } catch (err) {
    console.error("[Neura Error]", err);

    await sock
      .sendMessage(
        chatId,
        {
          text: "Neura lagi error nih, coba lagi bentar ya~",
        },
        {
          quoted: msg,
        }
      )
      .catch(() => {});
  }
};
