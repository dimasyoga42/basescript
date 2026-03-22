import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import ffmpeg from "fluent-ffmpeg";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";

try {
  const path = execSync("which ffmpeg").toString().trim();
  ffmpeg.setFfmpegPath(path);
} catch {}

const EFFECTS = {
  robot: ["-af", "asetrate=44100*0.8,aresample=44100,atempo=1.25"],
  bass: ["-af", "bass=g=20,aresample=44100"],
  chipmunk: ["-af", "asetrate=44100*1.5,aresample=44100,atempo=0.67"],
  slow: ["-af", "atempo=0.75"],
  fast: ["-af", "atempo=1.5"],
  reverse: ["-af", "areverse"],
  echo: ["-af", "aecho=0.8:0.9:1000:0.3"],
  deep: ["-af", "asetrate=44100*0.7,aresample=44100,atempo=1.43"],
};

const processAudio = (inputBuffer, effect) => {
  return new Promise((resolve, reject) => {
    const tmpIn = join(tmpdir(), `neura_in_${Date.now()}.mp3`);
    const tmpOut = join(tmpdir(), `neura_out_${Date.now()}.mp3`);

    const cleanup = () => {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    };

    try {
      writeFileSync(tmpIn, inputBuffer);

      ffmpeg(tmpIn)
        .outputOptions([...EFFECTS[effect], "-ar 44100", "-ac 2", "-b:a 192k"])
        .format("mp3")
        .on("end", () => {
          try {
            const buffer = readFileSync(tmpOut);
            cleanup();
            resolve(buffer);
          } catch (e) {
            cleanup();
            reject(e);
          }
        })
        .on("error", (err) => {
          cleanup();
          reject(err);
        })
        .save(tmpOut);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
};

const getAudio = (m) => {
  if (m.message?.audioMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quoted?.audioMessage ? { message: quoted } : null;
};

const handler = async (m, { conn }) => {
  try {
    const effect = m.text.trim().split(/\s+/)[0].replace(".", "").toLowerCase();
    const audioMsg = getAudio(m);

    if (!audioMsg)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: `Kirim/reply audio dengan perintah:\n\n${Object.keys(EFFECTS)
          .map((e) => `• .${e}`)
          .join("\n")}`,
        msg: m,
      });

    await sendText(conn, m.chat, "⏳ Memproses audio...", m);

    const buffer = await downloadMediaMessage(
      audioMsg,
      "buffer",
      {},
      { reuploadRequest: conn.updateMediaMessage },
    );

    const result = await processAudio(buffer, effect);

    await conn.sendMessage(
      m.chat,
      {
        audio: result,
        mimetype: "audio/mpeg",
        fileName: `${effect}.mp3`,
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("[voice]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = Object.keys(EFFECTS);
handler.category = "Menu Audio";
handler.submenu = "Audio";
export default handler;
