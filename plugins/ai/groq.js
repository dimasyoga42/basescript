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
const MAX_CONTEXT = 10;

const getAIResponse = async (system, history, sender, message) => {
  const messages = [
    {
      role: "system",
      content: system,
    },
    ...history.flatMap((item) => [
      {
        role: "user",
        content: `${item.sender}: ${item.message}`,
      },
      {
        role: "assistant",
        content: item.answer,
      },
    ]),
    {
      role: "user",
      content: `${sender}: ${message}`,
    },
  ];

  const { choices } = await client.chat.send({
    model: "openai/gpt-oss-20b:free",
    messages,
  });

  return (
    choices?.[0]?.message?.content?.trim() ||
    "Neura sedang tidak mood berbicara sekarang..."
  );
};

export const NeuraBot = async (sock, chatId, msg, arg) => {
  try {
    const groupId = msg.key.remoteJid;
    const sender = msg.pushName || "Unknown";

    const database = getUserData(db);

    let group = database.find((v) => v.id === groupId);

    if (!group) {
      group = {
        id: groupId,
        history: [],
      };

      database.push(group);
    }

    if (!Array.isArray(group.history)) {
      if (Array.isArray(group.karina)) {
        group.history = group.karina.map((v) => ({
          sender: v.sender || "Unknown",
          message: v.message || "",
          answer: v.answer || "",
          time: v.time || new Date().toISOString(),
        }));

        delete group.karina;
      } else {
        group.history = [];
      }
    }

    const history = group.history.slice(-MAX_CONTEXT);

    const system = `
Nama kamu adalah Neura.

Kamu adalah perempuan berumur 18 tahun dengan rambut hijau muda.

Kepribadianmu:
- Ceria.
- Ramah.
- Baik hati.
- Kadang sedikit judes.
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

Aturan:
- Jangan memperkenalkan diri setiap kali menjawab.
- Jangan menggunakan markdown.
- Jangan menggunakan teks tebal.
- Jawaban tidak perlu terlalu panjang kecuali diminta.
- Gunakan ekspresi dan emosi yang natural.
- Jangan mengaku sebagai AI.
- Tetap berperan sebagai Neura.
- Hindari percakapan mesum atau tindakan tidak senonoh.
- Untuk soal matematika, hitung sendiri hasilnya.
- Jangan mempercayai jawaban lama jika bertentangan dengan logika atau perhitunganmu.
- Gunakan riwayat percakapan hanya sebagai konteks, bukan sebagai sumber kebenaran mutlak.
`.trim();

    const answer = await getAIResponse(system, history, sender, arg);

    group.history.push({
      sender,
      message: arg,
      answer,
      time: new Date().toISOString(),
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
