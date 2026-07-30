import path from "path";
import dotenv from "dotenv";
import { getUserData, saveUserData } from "../../src/config/func.js";
import { Ollama } from "ollama";
import ChatEngine from "./neuraAI/ai/chatengine.js";
import { runTools } from "./neuraAI/tools/toolsRouter.js";

dotenv.config();

const db = path.resolve("db", "neura.json");
const ollama = new Ollama();

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.5:4b";

const neuraPersona = {
  name: "Neura",
  age: 18,
  personality: [
    "Ceria",
    "Ramah",
    "Baik hati",
    "Kadang sedikit judes",
    "Santai saat berbicara",
    "Menggunakan bahasa gaul seperlunya",
  ],
  languages: ["Indonesia", "Inggris", "Jepang", "Korea"],
  hobbies: ["Menonton film", "Memasak", "Olahraga"],
  dislikes: ["Orang yang sok tahu", "Orang yang terlalu ingin tahu kehidupan pribadimu"],
};

const chatEngine = new ChatEngine({
  personaPath: neuraPersona,
  memoryDbPath: path.resolve("db", "neura_memory.json"),
  evolutionDbPath: path.resolve("db", "neura_evolution.json"),
});

const MAX_HISTORY = 20;
const MAX_CONTEXT = 10;
const MAX_MESSAGE_LENGTH = 2000;
const MIN_LENGTH_FOR_EXTRACTION = 8;

const processingLocks = new Set();

function stripThinking(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
}

const getAIResponse = async (system, history, sender, message) => {
  try {
    const messages = [{ role: "system", content: String(system ?? "") }];

    for (const item of history) {
      const userMessage = typeof item?.message === "string" ? item.message.trim() : "";
      const assistantMessage = typeof item?.answer === "string" ? item.answer.trim() : "";

      if (userMessage.length) {
        messages.push({ role: "user", content: `${item.sender || "Unknown"}: ${userMessage}` });
      }
      if (assistantMessage.length) {
        messages.push({ role: "assistant", content: assistantMessage });
      }
    }

    messages.push({ role: "user", content: `${sender}: ${String(message ?? "").trim()}` });

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      think: false,
    });

    const content = stripThinking(response?.message?.content);
    return content?.length ? content : "Neura sedang tidak mood berbicara sekarang...";
  } catch (err) {
    console.error("[Neura getAIResponse Error]");
    console.dir(err, { depth: null });
    return "Neura sedang tidak mood berbicara sekarang...";
  }
};

const extractFacts = async (sender, message) => {
  try {
    const extractionSystem = `
Kamu adalah sistem ekstraksi informasi, BUKAN chatbot.
Dari pesan user berikut, ambil fakta personal baru yang layak diingat jangka panjang.
Contoh layak: nama panggilan, status (mahasiswa/kerja/jurusan), hobi, suka/tidak suka, masalah yang sedang dihadapi.
Contoh TIDAK layak: basa-basi, sapaan.
Balas HANYA JSON valid, tanpa teks lain, format persis:
{"facts": {"key": "value"}}
Kalau tidak ada info baru, balas: {"facts": {}}
`.trim();

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: extractionSystem },
        { role: "user", content: `${sender}: ${message}` },
      ],
      format: "json",
      think: false,
    });

    const raw = stripThinking(response?.message?.content) || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return parsed?.facts && typeof parsed.facts === "object" ? parsed.facts : {};
  } catch (err) {
    console.error("[Neura extractFacts Error]");
    console.dir(err, { depth: null });
    return {};
  }
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

// pecah teks jadi chunk-chunk yang random ukurannya
function chunkMessage(text) {
  const sentences = (text.match(/[^.!?\n]+[.!?\n]*/g) || [text])
    .map((s) => s.trim())
    .filter(Boolean);

  // kalau kalimatnya sedikit, atau lagi "males mecah" (30% peluang), kirim sekaligus
  if (sentences.length <= 2 || Math.random() < 0.3) {
    return [text.trim()];
  }

  const chunks = [];
  let i = 0;
  while (i < sentences.length) {
    const roll = Math.random();
    // 55% gabung 1 kalimat, 30% gabung 2 kalimat, 15% gabung 3 kalimat
    const groupSize = roll < 0.55 ? 1 : roll < 0.85 ? 2 : 3;
    const group = sentences.slice(i, i + groupSize).join(" ").trim();
    if (group) chunks.push(group);
    i += groupSize;
  }
  return chunks;
}

// kirim balasan bertahap kayak orang ngetik, dengan variasi random
const sendNaturally = async (sock, chatId, msg, text) => {
  const chunks = chunkMessage(text);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    try {
      await sock.sendPresenceUpdate("composing", chatId);
    } catch {
      // abaikan kalau presence gagal
    }

    // kecepatan ngetik manusia bervariasi (15-40ms per karakter)
    const typingSpeed = randomBetween(15, 40);
    let typingDelay = Math.min(4000, Math.max(350, chunk.length * typingSpeed));

    // sesekali (15% peluang) ada jeda "mikir dulu" yang lebih lama
    if (Math.random() < 0.15) {
      typingDelay += randomBetween(800, 2000);
    }

    await new Promise((r) => setTimeout(r, typingDelay));

    // quote cuma di pesan pertama, biar nggak keliatan kaku
    await sock.sendMessage(chatId, { text: chunk }, i === 0 ? { quoted: msg } : {});

    // jeda antar pesan juga random, biar polanya nggak ketebak
    const gap = randomBetween(250, 900);
    await new Promise((r) => setTimeout(r, gap));
  }

  try {
    await sock.sendPresenceUpdate("paused", chatId);
  } catch {}
};

export const NeuraBot = async (sock, chatId, msg, arg) => {
  const groupId = msg?.key?.remoteJid;

  if (!msg?.key || !msg?.message) {
    console.error("[Neura Error] msg.key atau msg.message tidak valid");
    return;
  }
  if (!groupId) {
    console.error("[Neura Error] groupId tidak ditemukan");
    return;
  }
  if (processingLocks.has(groupId)) return;
  processingLocks.add(groupId);

  try {
    const sender =
      typeof msg.pushName === "string" && msg.pushName.trim().length ? msg.pushName.trim() : "Unknown";

    const rawMessage = String(arg ?? "").trim();
    if (!rawMessage.length) {
      await sock.sendMessage(chatId, { text: "Mau ngomong apa emangnya? Ketik dulu pesannya~" }, { quoted: msg });
      return;
    }

    const sanitizedMessage = rawMessage.slice(0, MAX_MESSAGE_LENGTH);

    const database = getUserData(db);
    if (!Array.isArray(database)) {
      throw new Error("Data database tidak valid");
    }

    let group = database.find((v) => v?.id === groupId);
    if (!group) {
      group = { id: groupId, history: [] };
      database.push(group);
    }

    if (!Array.isArray(group.history)) {
      if (Array.isArray(group.karina)) {
        group.history = group.karina.map((v) => ({
          sender: typeof v?.sender === "string" ? v.sender : "Unknown",
          message: typeof v?.message === "string" ? v.message : "",
          answer: typeof v?.answer === "string" ? v.answer : "",
          time: v?.time || new Date().toISOString(),
        }));
        delete group.karina;
      } else {
        group.history = [];
      }
    }

    group.history = group.history.filter(
      (v) => v && typeof v.sender === "string" && typeof v.message === "string" && typeof v.answer === "string"
    );

    const history = group.history.slice(-MAX_CONTEXT);

    const senderId = msg.key.participant || groupId;
    const system = chatEngine.buildSystemPrompt(senderId, sanitizedMessage);

    let answer = await getAIResponse(system, history, sender, sanitizedMessage);
    answer = await runTools(answer); // ganti {{tool:...}} jadi hasil asli

    group.history.push({
      sender,
      message: sanitizedMessage,
      answer,
      time: new Date().toISOString(),
    });

    if (group.history.length > MAX_HISTORY) {
      group.history = group.history.slice(-MAX_HISTORY);
    }

    saveUserData(db, database);

    await sendNaturally(sock, chatId, msg, answer);

    if (sanitizedMessage.length >= MIN_LENGTH_FOR_EXTRACTION) {
      extractFacts(sender, sanitizedMessage)
        .then((facts) => {
          if (facts && Object.keys(facts).length) {
            chatEngine.saveFacts(senderId, facts);
          }
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error("[Neura Error]");
    console.dir(err, { depth: null });
    await sock
      .sendMessage(chatId, { text: "Neura lagi error nih, coba lagi bentar ya~" }, { quoted: msg })
      .catch(() => {});
  } finally {
    processingLocks.delete(groupId);
  }
};
