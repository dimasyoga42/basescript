import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import {
  reactMessage,
  sendFancyText,
  sendFancyTextModif,
  sendText,
} from "../../src/config/message.js";

import { config, thumbnail } from "../../config.js";

try {
  const path = execSync("which ffmpeg").toString().trim();
  ffmpeg.setFfmpegPath(path);
} catch {}

const convertToMp3 = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const tmpIn = join(tmpdir(), `neura_${Date.now()}.mp3`);
    const tmpOut = join(tmpdir(), `neura_${Date.now()}_fixed.mp3`);

    const cleanup = () => {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    };

    try {
      writeFileSync(tmpIn, inputBuffer);

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
            reject(err);
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
      `https://neurapi.mochinime.cyou/api/etc/play?query=${encodeURIComponent(
        query,
      )}`,
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
      image: data.thumbnail || thumbnail,
      caption: `🎵 ${data.title}

📺 Channel: ${data.channel}
⏱️ Durasi: ${data.duration}
👁️ Views: ${data.views}`,
      quoted: m,
    });

    await reactMessage(conn, m.chat, m, "⬇️");

    const audioRes = await axios.get(data.mp3.download_url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
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
      {
        quoted: m,
      },
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
