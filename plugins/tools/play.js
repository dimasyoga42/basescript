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

    // 1. Cari video di YouTube
    const searchRes = await axios.get(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
    );
    const searchData = searchRes.data;
    console.log("[PLAY SEARCH API]", searchData);

    const video = searchData?.data?.find((item) => item.type === "video");
    if (!searchData?.status || !video) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    await reactMessage(conn, m.chat, m, "⬇️");

    // 2. Ambil link download audio dari video yang ditemukan
    const dlRes = await axios.get(
      `https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(video.url)}`,
    );
    const dlData = dlRes.data;
    console.log("[PLAY DOWNLOAD API]", dlData);

    const audioEntry =
      dlData?.data?.find((d) => d.type === "audio") || dlData?.data?.[0];
    const audioUrl =
      audioEntry?.data?.url?.find((u) => u.type === "mp3" || u.ext === "mp3")
        ?.url || audioEntry?.data?.url?.[0]?.url;

    if (!dlData?.status || !audioUrl) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    const title = audioEntry?.data?.meta?.title || video.title;
    const duration = audioEntry?.data?.meta?.duration || video.timestamp;

    await sendFancyTextModif(conn, m.chat, {
      image: video.thumbnail || thumbnail,
      caption: `🎵 ${title}
📺 Channel: ${video.author?.name || "-"}
⏱️ Durasi: ${duration}
👁️ Views: ${video.views ?? "-"}`,
      quoted: m,
    });

    // 3. Download file audio-nya
    const audioRes = await axios.get(audioUrl, {
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
        fileName: `${title}.mp3`,
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
