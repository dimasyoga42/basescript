import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";
import {
  reactMessage,
  sendFancyText,
  sendFancyTextModif,
  sendText,
} from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";

const resolveFfmpegPath = () => {
  const candidates = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
  ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  try {
    const which = execSync("which ffmpeg", { stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim();
    if (which) return which;
  } catch {}

  return null;
};

const ffmpegPath = resolveFfmpegPath();
console.log("[FFMPEG PATH]", ffmpegPath);

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const convertToMp3 = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      return reject(new Error("FFmpeg tidak ditemukan di sistem"));
    }

    const ts = Date.now();
    const tmpIn = join(tmpdir(), `neura_in_${ts}.mp3`);
    const tmpOut = join(tmpdir(), `neura_out_${ts}.mp3`);

    const cleanup = () => {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    };

    try {
      writeFileSync(tmpIn, inputBuffer);
    } catch (err) {
      return reject(new Error(`Gagal menulis file temp: ${err.message}`));
    }

    ffmpeg(tmpIn)
      .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
      .format("mp3")
      .on("end", () => {
        try {
          const buffer = readFileSync(tmpOut);
          cleanup();
          resolve(buffer);
        } catch (err) {
          cleanup();
          reject(new Error(`Gagal membaca file output: ${err.message}`));
        }
      })
      .on("error", (err) => {
        cleanup();
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .save(tmpOut);
  });
};

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^(\.play|\.music|\.p)\s*/i, "").trim();
    if (!query) {
      return sendText(
        conn,
        m.chat,
        "Masukkan judul lagu\nContoh: .play Dia Anji",
        m,
      );
    }

    await reactMessage(conn, m.chat, m, "🔍");

    const res = await axios.get(
      `https://neurapi.mochinime.cyou/api/etc/play?query=${encodeURIComponent(query)}`,
      { timeout: 100000 },
    );

    const data = res.data;
    console.log("[PLAY API]", data);

    if (!data?.success || !data?.mp3?.download_url) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    await sendFancyTextModif(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: data.thumbnail || thumbnail,
      text: `🎵 ${data.title}\n📺 Channel: ${data.channel}\n⏱️ Durasi: ${data.duration}\n👁️ Views: ${data.views}`,
      msg: m,
    });

    await reactMessage(conn, m.chat, m, "⬇️");

    const audioRes = await axios.get(data.mp3.download_url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const mp3Buffer = Buffer.from(audioRes.data);

    let fixedBuffer;
    try {
      fixedBuffer = await convertToMp3(mp3Buffer);
    } catch (err) {
      console.log("[FFMPEG ERROR] Menggunakan file asli:", err.message);
      fixedBuffer = mp3Buffer;
    }

    await reactMessage(conn, m.chat, m, "🎵");

    await conn.sendMessage(
      m.chat,
      {
        audio: fixedBuffer,
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        ptt: false,
      },
      { quoted: m },
    );

    await reactMessage(conn, m.chat, m, "✅");
  } catch (err) {
    console.error("[PLAY ERROR]", err);
    await sendText(
      conn,
      m.chat,
      config.message.error || "Terjadi kesalahan saat memproses lagu.",
      m,
    );
  }
};

handler.command = "play";
handler.alias = ["music", "p"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
