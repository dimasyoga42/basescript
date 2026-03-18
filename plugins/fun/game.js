import axios from "axios";
import { sendText } from "../../src/config/message.js";
import { config } from "../../config.js";

const answer = new Map();

const fetchGame = {
  caklontong: () =>
    axios
      .get("https://api.deline.web.id/game/caklontong")
      .then((r) => r.data.data),
  tebakgambar: () =>
    axios
      .get("https://api.deline.web.id/game/tebakgambar")
      .then((r) => r.data.result),
  family100: () =>
    axios
      .get("https://api.deline.web.id/game/family100")
      .then((r) => r.data.result),
  susunkata: () =>
    axios
      .get(
        "https://raw.githubusercontent.com/dimasyoga42/dataset_Neura/master/games/susunkata.json",
      )
      .then((r) => {
        const data = r.data;
        return data[Math.floor(Math.random() * data.length)];
      }),
};

const handler = async (m, { conn }) => {
  try {
    const args = m.text.trim().split(/\s+/);
    const sub = args[1]?.toLowerCase();

    // .game skip / .game nyerah
    if (sub === "skip" || sub === "nyerah") {
      if (!answer.has(m.chat))
        return sendText(conn, m.chat, "No active game", m);
      const game = answer.get(m.chat);
      clearTimeout(game.timeout);
      answer.delete(m.chat);
      return sendText(
        conn,
        m.chat,
        `Giving up? The answer was: *${Array.isArray(game.jawaban) ? game.jawaban.join(", ") : game.jawaban}*`,
        m,
      );
    }

    // Validasi game name
    const games = Object.keys(fetchGame);
    if (!sub || !games.includes(sub))
      return sendText(
        conn,
        m.chat,
        `Choose a game:\n${games.map((g) => `• .game ${g}`).join("\n")}`,
        m,
      );

    if (answer.has(m.chat))
      return sendText(conn, m.chat, "Finish the current game first", m);

    const data = await fetchGame[sub]();
    if (!data) return sendText(conn, m.chat, "Failed to load game data", m);

    let sent, timeout;

    // CAKLONTONG
    if (sub === "caklontong") {
      sent = await conn.sendMessage(
        m.chat,
        {
          text: `*CAKLONTONG*\n\n${data.soal}\n\nTime: 60s\nReply this message to answer`,
        },
        { quoted: m },
      );
      timeout = setTimeout(async () => {
        if (!answer.has(m.chat)) return;
        answer.delete(m.chat);
        await conn.sendMessage(
          m.chat,
          { text: `Time's up!\nAnswer: *${data.jawaban}*\n${data.deskripsi}` },
          { quoted: sent },
        );
      }, 60000);
      answer.set(m.chat, {
        type: "caklontong",
        jawaban: data.jawaban.toUpperCase(),
        timeout,
        msgId: sent.key.id,
      });
    }

    // TEBAK GAMBAR
    else if (sub === "tebakgambar") {
      sent = await conn.sendMessage(
        m.chat,
        {
          image: { url: data.img },
          caption: `*TEBAK GAMBAR*\n\n${data.deskripsi}\n\nTime: 60s\nReply this image to answer`,
        },
        { quoted: m },
      );
      timeout = setTimeout(async () => {
        if (!answer.has(m.chat)) return;
        answer.delete(m.chat);
        await conn.sendMessage(
          m.chat,
          { text: `Time's up!\nAnswer: *${data.jawaban}*` },
          { quoted: sent },
        );
      }, 60000);
      answer.set(m.chat, {
        type: "tebakgambar",
        jawaban: data.jawaban.toUpperCase(),
        timeout,
        msgId: sent.key.id,
      });
    }

    // FAMILY100
    else if (sub === "family100") {
      const list = data.jawaban.map((v) => v.toUpperCase());
      sent = await conn.sendMessage(
        m.chat,
        {
          text: `*FAMILY 100*\n\n${data.soal}\n\nAnswers: ${list.length}\nTime: 60s\nReply this message to answer`,
        },
        { quoted: m },
      );
      timeout = setTimeout(async () => {
        if (!answer.has(m.chat)) return;
        const game = answer.get(m.chat);
        answer.delete(m.chat);
        await conn.sendMessage(
          m.chat,
          {
            text: `Time's up!\nRemaining answers:\n${game.jawaban.join("\n")}`,
          },
          { quoted: sent },
        );
      }, 60000);
      answer.set(m.chat, {
        type: "family100",
        jawaban: list,
        timeout,
        msgId: sent.key.id,
      });
    }

    // SUSUN KATA
    else if (sub === "susunkata") {
      if (!data?.soal || !data?.jawaban)
        return sendText(conn, m.chat, "Invalid question data", m);
      sent = await conn.sendMessage(
        m.chat,
        {
          text: `*SUSUN KATA*\n\nQuestion: ${data.soal}\nCategory: ${data.tipe || "-"}\nTime: 60s\nReply this message to answer`,
        },
        { quoted: m },
      );
      timeout = setTimeout(async () => {
        if (!answer.has(m.chat)) return;
        const game = answer.get(m.chat);
        answer.delete(m.chat);
        await conn.sendMessage(
          m.chat,
          { text: `Time's up!\nAnswer: *${game.jawaban}*` },
          { quoted: sent },
        );
      }, 60000);
      answer.set(m.chat, {
        type: "susunkata",
        jawaban: data.jawaban.toUpperCase().trim(),
        timeout,
        msgId: sent.key.id,
      });
    }
  } catch (err) {
    console.error("[game]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

// Jawab — dipanggil di messages.upsert
export const jawab = async (conn, m) => {
  try {
    if (!answer.has(m.chat)) return;
    const game = answer.get(m.chat);

    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (!ctx || ctx.stanzaId !== game.msgId) return;

    const userAnswer = (m.message.extendedTextMessage?.text || "")
      .trim()
      .toUpperCase();
    if (!userAnswer) return;

    // CAKLONTONG / TEBAK GAMBAR / SUSUN KATA
    if (["caklontong", "tebakgambar", "susunkata"].includes(game.type)) {
      const correct = game.jawaban;
      if (userAnswer === correct || correct.includes(userAnswer)) {
        clearTimeout(game.timeout);
        answer.delete(m.chat);
        return conn.sendMessage(
          m.chat,
          { text: "Correct answer!" },
          { quoted: m },
        );
      }
      return conn.sendMessage(
        m.chat,
        { text: "Wrong answer, try again" },
        { quoted: m },
      );
    }

    // FAMILY100
    if (game.type === "family100") {
      const idx = game.jawaban.findIndex(
        (v) => v === userAnswer || v.includes(userAnswer),
      );
      if (idx !== -1) {
        const benar = game.jawaban[idx];
        game.jawaban.splice(idx, 1);
        if (game.jawaban.length === 0) {
          clearTimeout(game.timeout);
          answer.delete(m.chat);
          return conn.sendMessage(
            m.chat,
            { text: `Correct: *${benar}*\nAll answers found! Game over` },
            { quoted: m },
          );
        }
        return conn.sendMessage(
          m.chat,
          { text: `Correct: *${benar}*\nRemaining: ${game.jawaban.length}` },
          { quoted: m },
        );
      }
      return conn.sendMessage(
        m.chat,
        { text: "Wrong answer, try again" },
        { quoted: m },
      );
    }
  } catch (err) {
    console.error("[jawab]", err.message);
  }
};

handler.command = ["game"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
