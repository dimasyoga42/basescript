import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import { getUserData, saveUserData } from "../../src/config/func.js";
import ChatEngine from "./neuraAI/ai/chatengine.js";
import { runTools } from "./neuraAI/tools/toolsRouter.js";

dotenv.config();

const db = path.resolve("db", "neura.json");

const AI_API_ENDPOINT = process.env.AI_API_ENDPOINT || "https://api.siputzx.my.id/api/ai/gptoss120b";
const AI_TEMPERATURE = process.env.AI_TEMPERATURE || "0.4";
const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000;

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
  try {
    const response = await axios.get(AI_API_ENDPOINT, {
      params: {
        prompt,
        system,
        temperature: String(AI_TEMPERATURE),
      },
      timeout: AI_REQUEST_TIMEOUT_MS,
    });

    return extractTextFromApiResponse(response.data);
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      const timeoutErr = new Error(
        `AI API request timeout setelah ${AI_REQUEST_TIMEOUT_MS}ms`
      );
      timeoutErr.name = "AbortError";
      throw timeoutErr;
    }

    if (err.response) {
      throw new Error(
        `AI API merespons dengan status ${err.response.status}`
      );
    }

    throw err;
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

const MAX_HISTORY = 500;
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
    } else if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND") {
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
