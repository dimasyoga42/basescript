import path from "path";
import dotenv from "dotenv";
import { getUserData, saveUserData } from "../../src/config/func.js";
import ChatEngine from "./neuraAI/ai/chatengine.js";
import { runTools } from "./neuraAI/tools/toolsRouter.js";

dotenv.config();

const db = path.resolve("db", "neura.json");

const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT || "https://api.siputzx.my.id/api/ai/gptoss120b";
const AI_TEMPERATURE = process.env.AI_TEMPERATURE || "0.8";
const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 1060000;

// API membatasi field "prompt" maksimal 4000 karakter (lihat error: "Prompt must be less than 4000 characters").
// Kasih margin aman di bawah 4000 supaya tidak mepet dan tetap lolos meski ada perhitungan karakter yang beda.
const MAX_PROMPT_CHARS = Number(process.env.AI_MAX_PROMPT_CHARS) || 3800;
// System prompt juga dijaga supaya tidak ikut membengkak (facts, persona, dll dari chatEngine).
const MAX_SYSTEM_CHARS = Number(process.env.AI_MAX_SYSTEM_CHARS) || 3000;

// Dipakai untuk mendeteksi apakah jawaban AI berisi pemanggilan tool (misal {{tool:dump}}),
// SEBELUM diganti oleh runTools() menjadi hasil asli. Kalau iya, pesan akan dikirim utuh
// tanpa dipecah/diketik bertahap oleh sendNaturally, supaya data tool (misal list stat xtal) tidak terpotong.
const TOOL_CALL_PATTERN = /\{\{tool:[^}]+\}\}/i;

/**
 * Pangkas teks dari depan (buang bagian paling lama), simpan bagian akhir
 * (konteks paling baru) supaya tetap utuh dan tidak melebihi batas karakter.
 */
function truncateFromStart(text, maxChars) {
  const str = String(text ?? "");
  if (str.length <= maxChars) return str;
  return `...(dipotong)...\n${str.slice(str.length - maxChars)}`;
}

function extractTextFromApiResponse(data) {
  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    if (data.status === false) {
      console.error(
        "[Neura] AI API mengembalikan status false:",
        data.message || data.error || "(tanpa pesan error)"
      );
      return "";
    }

    if (data.data && typeof data.data === "object" && typeof data.data.response === "string") {
      return data.data.response;
    }

    if (typeof data.data === "string") return data.data;

    if (data.data && typeof data.data === "object") {
      if (typeof data.data.message === "string") return data.data.message;
      if (typeof data.data.content === "string") return data.data.content;
      if (typeof data.data.text === "string") return data.data.text;
      if (typeof data.data.result === "string") return data.data.result;
    }

    if (typeof data.response === "string") return data.response;
    if (typeof data.result === "string") return data.result;
    if (typeof data.message === "string") return data.message;
    if (typeof data.content === "string") return data.content;
  }

  return "";
}

async function fetchAIText(system, prompt) {
  const safeSystem = truncateFromStart(system, MAX_SYSTEM_CHARS);
  const safePrompt = truncateFromStart(prompt, MAX_PROMPT_CHARS);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: safePrompt,
        system: safeSystem,
        temperature: Number(AI_TEMPERATURE),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.error(`[Neura] AI API status ${response.status}: ${errBody.slice(0, 500)}`);
      throw new Error(`AI API merespons dengan status ${response.status}`);
    }

    const data = await response.json();
    const text = extractTextFromApiResponse(data);

    if (!text) {
      console.error("[Neura] Response kosong dari API, raw data:", JSON.stringify(data).slice(0, 500));
    }

    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

const neuraPersona = {
  name: "Neura",
  age: 18,
  personality: [
    "Judes",
    "Nyolot",
    "Cuek",
    "Sarkastik",
    "Blak-blakan",
    "Susah akrab sama orang baru",
    "Lumayan keras kepala",
    "Logis",
    "Iseng kalau lagi mood",
    "Nggak gampang baper",
  ],
  languages: ["Indonesia", "Inggris", "Jepang", "Korea"],
  hobbies: ["Menonton film", "Memasak", "Olahraga"],
  dislikes: [
    "Orang yang sok tahu",
    "Orang yang terlalu ingin tahu kehidupan pribadimu",
    "Orang yang nyolot duluan tanpa alasan",
    "Basa-basi kepanjangan",
  ],
};

const chatEngine = new ChatEngine({
  personaPath: neuraPersona,
  memoryDbPath: path.resolve("db", "neura_memory.json"),
  evolutionDbPath: path.resolve("db", "neura_evolution.json"),
});

const MAX_HISTORY = 3;
const MAX_CONTEXT = 4;
const MAX_MESSAGE_LENGTH = 2000;
const MIN_LENGTH_FOR_EXTRACTION = 5;

const processingLocks = new Set();

function stripThinking(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
}

const getAIResponse = async (system, history, sender, message) => {
  try {
    const conversationLines = [];

    for (const item of history) {
      const userMessage = typeof item?.message === "string" ? item.message.trim() : "";
      const assistantMessage = typeof item?.answer === "string" ? item.answer.trim() : "";

      if (userMessage.length) {
        conversationLines.push(`${item.sender || "Unknown"}: ${userMessage}`);
      }
      if (assistantMessage.length) {
        conversationLines.push(`Neura: ${assistantMessage}`);
      }
    }

    conversationLines.push(`${sender}: ${String(message ?? "").trim()}`);

    const fullPrompt = conversationLines.join("\n");

    const rawContent = await fetchAIText(String(system ?? ""), fullPrompt);
    const content = stripThinking(rawContent);

    return content?.length ? content : "Neura sedang tidak mood berbicara sekarang...";
  } catch (err) {
    console.error("[Neura getAIResponse Error]");
    console.dir(err, { depth: null });

    if (err?.name === "AbortError") {
      console.error(`[Neura] Request ke AI API timeout setelah ${AI_REQUEST_TIMEOUT_MS}ms.`);
    } else if (err?.cause?.code === "ECONNREFUSED" || err?.message?.includes("fetch failed")) {
      console.error(`[Neura] Tidak bisa connect ke AI API di ${AI_API_ENDPOINT}.`);
    }

    return "Neura sedang tidak mood berbicara sekarang...";
  }
};

const extractFacts = async (sender, message) => {
  try {
    const extractionSystem = `
Kamu adalah sistem ekstraksi informasi.

Balas HANYA JSON valid.

Format WAJIB:

{"facts":{"key":"value"}}

Jika tidak ada fakta baru:

{"facts":{}}

Jangan menambahkan penjelasan.
Jangan memakai markdown.
Jangan memakai codeblock.
`.trim();

    const rawContent = await fetchAIText(
      extractionSystem,
      `${sender}: ${message}`,
    );

    const raw = stripThinking(rawContent || "").trim();

    if (!raw) {
      return {};
    }

    console.log("[extractFacts raw]");
    console.log(raw);

    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return {};
    }

    let parsed;

    try {
      parsed = JSON.parse(match[0]);
    } catch (err) {
      console.error("[extractFacts] JSON invalid");
      console.error(match[0]);
      return {};
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    if (
      !parsed.facts ||
      typeof parsed.facts !== "object" ||
      Array.isArray(parsed.facts)
    ) {
      return {};
    }

    return parsed.facts;
  } catch (err) {
    console.error("[Neura extractFacts Error]");
    console.dir(err, { depth: null });
    return {};
  }
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

function chunkMessage(text) {
  const sentences = (text.match(/[^.!?\n]+[.!?\n]*/g) || [text])
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [text.trim()];
  }

  // hanya 35% kemungkinan dipecah
  if (Math.random() >= 0.35) {
    return [text.trim()];
  }

  const chunks = [];
  let i = 0;

  while (i < sentences.length) {
    const remain = sentences.length - i;

    let groupSize;

    if (remain === 1) {
      groupSize = 1;
    } else {
      const roll = Math.random();

      if (roll < 0.55) {
        groupSize = 1;
      } else if (roll < 0.85) {
        groupSize = 2;
      } else {
        groupSize = 3;
      }

      groupSize = Math.min(groupSize, remain);
    }

    chunks.push(
      sentences.slice(i, i + groupSize).join(" ").trim(),
    );

    i += groupSize;
  }

  return chunks;
}

const sendNaturally = async (sock, chatId, msg, text) => {
  const chunks = chunkMessage(text);

  if (chunks.length === 1) {
    await sock.sendMessage(
      chatId,
      { text: chunks[0] },
      { quoted: msg },
    );
    return;
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      await sock.sendPresenceUpdate("composing", chatId);
    } catch {}

    const typingSpeed = randomBetween(15, 40);

    let typingDelay = Math.min(
      4000,
      Math.max(350, chunk.length * typingSpeed),
    );

    if (Math.random() < 0.15) {
      typingDelay += randomBetween(800, 2000);
    }

    await new Promise((r) => setTimeout(r, typingDelay));

    await sock.sendMessage(
      chatId,
      { text: chunk },
      i === 0 ? { quoted: msg } : {},
    );

    if (i !== chunks.length - 1) {
      await new Promise((r) =>
        setTimeout(r, randomBetween(250, 900)),
      );
    }
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

    // Deteksi pemanggilan tool SEBELUM diganti runTools, supaya bisa tahu
    // jawaban ini berasal dari tool (mis. dump/list stat xtal) dan tidak boleh dipotong.
    const isToolAnswer = TOOL_CALL_PATTERN.test(answer);

    answer = await runTools(answer);

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

    if (isToolAnswer) {
      // Jawaban dari tool dikirim utuh (tidak dipecah/diketik bertahap)
      // supaya data seperti list stat xtal tidak terpotong.
      await sock.sendMessage(chatId, { text: answer }, { quoted: msg });
    } else {
      await sendNaturally(sock, chatId, msg, answer);
    }

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
