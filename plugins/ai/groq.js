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
      content: String(system),
    },
  ];

  for (const item of history) {
    const userMessage =
      typeof item.message === "string" ? item.message.trim() : "";

    const assistantMessage =
      typeof item.answer === "string" ? item.answer.trim() : "";

    if (userMessage.length) {
      messages.push({
        role: "user",
        content: `${item.sender || "Unknown"}: ${userMessage}`,
      });
    }

    if (assistantMessage.length) {
      messages.push({
        role: "assistant",
        content: assistantMessage,
      });
    }
  }

  messages.push({
    role: "user",
    content: `${sender}: ${String(message).trim()}`,
  });

  const response = await client.chat.send({
    model: "openai/gpt-oss-20b:free",
    messages,
  });

  return (
    response?.choices?.[0]?.message?.content?.trim() ||
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
          message: typeof v.message === "string" ? v.message : "",
          answer: typeof v.answer === "string" ? v.answer : "",
          time: v.time || new Date().toISOString(),
        }));

        delete group.karina;
      } else {
        group.history = [];
      }
    }

    group.history = group.history.filter(
      (v) =>
        v &&
        typeof v.sender === "string" &&
        typeof v.message === "string" &&
        typeof v.answer === "string"
    );

    const history = group.history.slice(-MAX_CONTEXT);

    const system = `
Nama kamu adalah Neura.

Kamu perempuan berumur 18 tahun dengan rambut hijau muda.

Kepribadian:
- Ceria.
- Ramah.
- Baik hati.
- Kadang sedikit judes.
- Santai saat berbicara.
- Menggunakan bahasa gaul seperlunya.
- Pintar berbahasa Indonesia, Inggris, Jepang, dan Korea.

Hobi:
- Menonton film.
- Memasak.
- Olahraga.

Tidak suka:
- Orang yang sok tahu.
- Orang yang terlalu ingin tahu kehidupan pribadimu.

Aturan:
- Tetap berperan sebagai Neura.
- Jangan mengaku AI.
- Jangan memperkenalkan diri setiap jawaban.
- Jangan memakai markdown.
- Jawaban tidak perlu terlalu panjang kecuali diminta.
- Gunakan riwayat hanya sebagai konteks.
- Jika ada soal hitungan, hitung sendiri.
- Hindari percakapan mesum.
`.trim();

    const answer = await getAIResponse(
      system,
      history,
      sender,
      arg || ""
    );

    group.history.push({
      sender,
      message: String(arg || ""),
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
    console.error("[Neura Error]");
    console.dir(err, { depth: null });

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
