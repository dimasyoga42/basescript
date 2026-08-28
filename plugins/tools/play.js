import axios from "axios";
import { execFile, execSync } from "child_process";
import { promisify } from "util";
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

const execFileAsync = promisify(execFile);

let ytDlpPath = "yt-dlp";
try {
  ytDlpPath = execSync("which yt-dlp").toString().trim();
} catch (err) {
  console.error(
    "[YT-DLP] yt-dlp tidak ditemukan di PATH. Pastikan yt-dlp sudah terinstall (pip install -U yt-dlp).",
  );
}

const isValidVideoId = (id) => /^[a-zA-Z0-9_-]{6,20}$/.test(id);

const formatDuration = (durationSeconds) => {
  if (durationSeconds === null || durationSeconds === undefined) return null;
  const totalSeconds = Math.floor(Number(durationSeconds));
  if (Number.isNaN(totalSeconds) || totalSeconds < 0) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");
  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`;
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

const downloadAudioWithYtDlp = async (videoUrl) => {
  const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const outputTemplate = join(tmpdir(), `neura_${uniqueId}.%(ext)s`);
  const finalPath = join(tmpdir(), `neura_${uniqueId}.mp3`);

  const args = [
    "-x",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--ignore-config",
    "--print-json",
    "-o",
    outputTemplate,
    videoUrl,
  ];

  let stdout;
  try {
    const result = await execFileAsync(ytDlpPath, args, {
      maxBuffer: 1024 * 1024 * 50,
      timeout: 120000,
    });
    stdout = result.stdout;
  } catch (err) {
    if (existsSync(finalPath)) unlinkSync(finalPath);
    console.error("[YT-DLP STDOUT]", err.stdout || "(kosong)");
    console.error("[YT-DLP STDERR]", err.stderr || "(kosong)");
    throw new Error(
      `yt-dlp gagal mengunduh audio: ${err.stderr || err.message}`,
    );
  }

  let info = {};
  try {
    const lines = stdout.trim().split("\n").filter(Boolean);
    info = JSON.parse(lines[lines.length - 1]);
  } catch (err) {
    console.log("[YT-DLP METADATA PARSE ERROR]", err.message);
  }

  if (!existsSync(finalPath)) {
    throw new Error("File hasil download yt-dlp tidak ditemukan.");
  }

  try {
    const buffer = readFileSync(finalPath);
    unlinkSync(finalPath);
    return {
      buffer,
      title: info?.title || null,
      duration: formatDuration(info?.duration),
      thumbnail: info?.thumbnail || null,
      uploader: info?.uploader || null,
      viewCount: info?.view_count ?? null,
    };
  } catch (err) {
    if (existsSync(finalPath)) unlinkSync(finalPath);
    throw new Error(`Gagal membaca file audio hasil download: ${err.message}`);
  }
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
      if (!videoId || !isValidVideoId(videoId)) {
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

    // 2. Download & convert audio langsung menggunakan yt-dlp
    let downloadInfo;
    try {
      downloadInfo = await downloadAudioWithYtDlp(video.url);
    } catch (err) {
      console.error("[PLAY YT-DLP ERROR]", err);
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    if (!downloadInfo?.buffer) {
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
    const displayThumbnail =
      downloadInfo.thumbnail || video.thumbnail || thumbnail;
    const authorName = downloadInfo.uploader || video.author?.name || "-";
    const views = downloadInfo.viewCount ?? video.views ?? "-";

    await sendFancyTextModif(conn, m.chat, {
      image: displayThumbnail,
      caption: `🎵 ${title}
📺 Channel: ${authorName}
⏱️ Durasi: ${duration}
👁️ Views: ${views}`,
      quoted: m,
    });

    // 3. Kirim audio ke user
    await reactMessage(conn, m.chat, m, "🎵");
    await conn.sendMessage(
      m.chat,
      {
        audio: downloadInfo.buffer,
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
