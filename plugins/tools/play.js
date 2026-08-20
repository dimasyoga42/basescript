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
  buildSelectButton,
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

const fetchVideoMeta = async (videoUrl) => {
  try {
    const oembedRes = await axios.get(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      { timeout: 15000 },
    );
    const oembedData = oembedRes.data;
    return {
      title: oembedData?.title || "Unknown Title",
      thumbnail: oembedData?.thumbnail_url || thumbnail,
      author: { name: oembedData?.author_name || "-" },
      timestamp: "-",
      views: "-",
    };
  } catch (err) {
    console.log("[PLAY OEMBED ERROR]", err.message);
    return {
      title: "Unknown Title",
      thumbnail,
      author: { name: "-" },
      timestamp: "-",
      views: "-",
    };
  }
};

const extractDownloadInfo = (dlData) => {
  const videoContainer = dlData?.data?.find((d) => d.type === "video");
  const videoEntry = videoContainer?.data?.[0];
  if (!videoEntry) return null;

  const formats = Array.isArray(videoEntry.url) ? videoEntry.url : [];

  const audioFormats = formats
    .filter(
      (f) =>
        f?.audio === true &&
        typeof f?.url === "string" &&
        f.url.startsWith("http"),
    )
    .sort(
      (a, b) => (b.qualityNumber || 0) - (a.qualityNumber || 0),
    );

  const combinedFormats = formats
    .filter(
      (f) =>
        f?.downloadable === true &&
        typeof f?.url === "string" &&
        f.url.startsWith("http"),
    )
    .sort(
      (a, b) => (b.qualityNumber || 0) - (a.qualityNumber || 0),
    );

  const bestFormat = audioFormats[0] || combinedFormats[0];
  if (!bestFormat) return null;

  return {
    downloadUrl: bestFormat.url,
    title: videoEntry.meta?.title || null,
    duration: videoEntry.meta?.duration || null,
    thumb: videoEntry.thumb || null,
  };
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

    let video;

    const isVideoIdSelection = /^id:/i.test(query);

    if (isVideoIdSelection) {
      const videoId = query.replace(/^id:/i, "").trim();
      if (!videoId) {
        return sendText(
          conn,
          m.chat,
          "Masukkan judul lagu\nContoh: .play Dia Anji",
          m,
        );
      }
      const videoUrl = `https://youtube.com/watch?v=${videoId}`;
      const meta = await fetchVideoMeta(videoUrl);
      video = {
        url: videoUrl,
        title: meta.title,
        thumbnail: meta.thumbnail,
        timestamp: meta.timestamp,
        views: meta.views,
        author: meta.author,
      };
    } else {
      // 1. Cari video di YouTube
      const searchRes = await axios.get(
        `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
      );
      const searchData = searchRes.data;
      console.log("[PLAY SEARCH API]", searchData);

      const videos =
        searchData?.data?.filter((item) => item.type === "video") || [];

      if (!searchData?.status || videos.length === 0) {
        return sendFancyText(conn, m.chat, {
          title: config.BotName,
          body: `Developer By ${config.OwnerName}`,
          thumbnail,
          text: config.message.notFound,
          msg: m,
        });
      }

      const results = videos.slice(0, 10);

      await conn.sendButton(m.chat, {
        text: `Ditemukan ${results.length} hasil untuk *${query}*\nSilahkan pilih salah satu lagu di bawah ini`,
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "Daftar Lagu",
            "Silahkan pilih salah satu",
            results.map((item) => ({
              title: item.title,
              description: `${item.author?.name || "-"} • ${item.timestamp || "-"} • ${item.views ?? "-"} views`,
              id: `.play id:${item.videoId}`,
            })),
          ),
        ],
        bottom_sheet: true,
        bottom_name: "Menu Musik",
      });

      return;
    }

    await reactMessage(conn, m.chat, m, "⬇️");

    // 2. Ambil link download audio dari video yang ditemukan
    const dlRes = await axios.get(
      `https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(video.url)}`,
    );
    const dlData = dlRes.data;
    console.log("[PLAY DOWNLOAD API]", dlData);

    if (!dlData?.status) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    const downloadInfo = extractDownloadInfo(dlData);

    if (!downloadInfo?.downloadUrl) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    const title = downloadInfo.title || video.title;
    const duration = downloadInfo.duration || video.timestamp;
    const displayThumbnail = downloadInfo.thumb || video.thumbnail || thumbnail;

    await sendFancyTextModif(conn, m.chat, {
      image: displayThumbnail,
      caption: `🎵 ${title}
📺 Channel: ${video.author?.name || "-"}
⏱️ Durasi: ${duration}
👁️ Views: ${video.views ?? "-"}`,
      quoted: m,
    });

    // 3. Download file audio-nya
    const audioRes = await axios.get(downloadInfo.downloadUrl, {
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
