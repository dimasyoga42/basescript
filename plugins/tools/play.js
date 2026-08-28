import axios from "axios";
import { execFile, execSync } from "child_process";
import { promisify } from "util";
import {
  readFileSync,
  unlinkSync,
  existsSync,
  readdirSync,
} from "fs";
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

/* =========================================================
 * BINARIES
 * ======================================================= */

let ytDlpPath = "yt-dlp";
let ffmpegPath = "ffmpeg";

/*
 * Cari yt-dlp
 */
try {
  const detectedYtDlp = execSync("which yt-dlp", {
    encoding: "utf8",
  }).trim();

  if (detectedYtDlp) {
    ytDlpPath = detectedYtDlp;
  }
} catch {
  console.error(
    "[YT-DLP] yt-dlp tidak ditemukan di PATH."
  );
}

/*
 * Cari ffmpeg
 */
try {
  const detectedFfmpeg = execSync("which ffmpeg", {
    encoding: "utf8",
  }).trim();

  if (detectedFfmpeg) {
    ffmpegPath = detectedFfmpeg;
  }
} catch {
  console.error(
    "[FFMPEG] ffmpeg tidak ditemukan di PATH."
  );
}

console.log("[PLAY] yt-dlp:", ytDlpPath);
console.log("[PLAY] ffmpeg:", ffmpegPath);

/* =========================================================
 * HELPERS
 * ======================================================= */

const isValidVideoId = (id) => {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
};

const formatDuration = (durationSeconds) => {
  if (
    durationSeconds === null ||
    durationSeconds === undefined ||
    durationSeconds === ""
  ) {
    return "-";
  }

  const totalSeconds = Math.floor(
    Number(durationSeconds)
  );

  if (
    Number.isNaN(totalSeconds) ||
    totalSeconds < 0
  ) {
    return "-";
  }

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  const mm = String(minutes).padStart(
    2,
    "0"
  );

  const ss = String(seconds).padStart(
    2,
    "0"
  );

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }

  return `${minutes}:${ss}`;
};

const safeFileName = (name) => {
  return String(name || "audio")
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "audio";
};

/* =========================================================
 * TEMP FILE CLEANUP
 * ======================================================= */

const cleanupFile = (file) => {
  if (!file) return;

  try {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  } catch (err) {
    console.error(
      "[PLAY CLEANUP ERROR]",
      file,
      err?.message
    );
  }
};

const cleanupTempFiles = (
  basePath
) => {
  if (!basePath) return;

  try {
    const directory = tmpdir();

    const baseName =
      basePath.split("/").pop();

    if (!baseName) return;

    const files =
      readdirSync(directory);

    for (const file of files) {
      if (
        file.startsWith(baseName)
      ) {
        cleanupFile(
          join(directory, file)
        );
      }
    }
  } catch (err) {
    console.error(
      "[PLAY TEMP CLEANUP ERROR]",
      err?.message
    );
  }
};

/* =========================================================
 * YOUTUBE OEMBED
 * ======================================================= */

const fetchVideoMeta = async (
  videoUrl
) => {
  try {
    const response =
      await axios.get(
        "https://www.youtube.com/oembed",
        {
          params: {
            url: videoUrl,
            format: "json",
          },
          timeout: 15000,
        }
      );

    const data =
      response?.data;

    return {
      title:
        data?.title ||
        "Unknown Title",

      thumbnail:
        data?.thumbnail_url ||
        thumbnail,

      author: {
        name:
          data?.author_name ||
          "-",
      },

      timestamp: "-",
      views: "-",
    };
  } catch (err) {
    console.error(
      "[PLAY OEMBED ERROR]",
      err?.message
    );

    return {
      title: "Unknown Title",
      thumbnail,

      author: {
        name: "-",
      },

      timestamp: "-",
      views: "-",
    };
  }
};

/* =========================================================
 * DOWNLOAD AUDIO SOURCE
 *
 * yt-dlp:
 *   Hanya mengambil audio source.
 *
 * FFmpeg:
 *   Melakukan conversion menjadi MP3.
 * ======================================================= */

const downloadAudio = async (
  videoUrl
) => {
  const uniqueId =
    `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

  const basePath = join(
    tmpdir(),
    `neura_${uniqueId}`
  );

  const inputTemplate =
    `${basePath}.%(ext)s`;

  const outputPath =
    `${basePath}.mp3`;

  let sourcePath = null;

  try {
    console.log(
      "[PLAY] Download audio source:",
      videoUrl
    );

    /* =====================================================
     * 1. YT-DLP
     * =================================================== */

    const ytArgs = [
      /*
       * Audio terbaik saja.
       *
       * Tidak memakai:
       * --extract-audio
       * --audio-format
       * --audio-quality
       *
       * Karena conversion dilakukan oleh FFmpeg.
       */
      "-f",
      "bestaudio/best",

      "--no-playlist",
      "--no-warnings",
      "--no-progress",
      "--ignore-config",

      /*
       * Paksa pakai IPv4.
       *
       * Beberapa server/VPS punya IPv6 yang terdaftar
       * di interface tapi tidak benar-benar bisa routing
       * keluar, menyebabkan koneksi ke CDN video macet
       * atau timeout meski akses web YouTube normal
       * lancar (karena domain utama masih resolve IPv4).
       */
      "--force-ipv4",

      /*
       * Gunakan player client "android" (fallback ke
       * "web") supaya ekstraksi tidak bergantung pada
       * JS runtime untuk decode signature, dan koneksi
       * ke CDN download biasanya lebih stabil.
       */
      "--extractor-args",
      "youtube:player_client=android,web",

      /*
       * Retry & timeout socket supaya tidak langsung
       * menyerah kalau koneksi ke CDN sedang lambat.
       */
      "--socket-timeout",
      "15",
      "--retries",
      "5",

      /*
       * Jangan gunakan file .part sementara,
       * langsung tulis ke file output.
       */
      "--no-part",

      /*
       * Output sementara.
       */
      "-o",
      inputTemplate,

      videoUrl,
    ];

    const ytResult =
      await execFileAsync(
        ytDlpPath,
        ytArgs,
        {
          maxBuffer:
            50 * 1024 * 1024,

          timeout:
            180000,

          windowsHide:
            true,
        }
      );

    console.log(
      "[PLAY] yt-dlp selesai."
    );

    if (ytResult?.stderr) {
      console.log(
        "[YT-DLP STDERR]",
        ytResult.stderr
      );
    }

    /* =====================================================
     * 2. CARI FILE HASIL YT-DLP
     * =================================================== */

    const possibleExtensions = [
      "webm",
      "m4a",
      "opus",
      "mp4",
      "aac",
      "ogg",
    ];

    for (
      const ext of possibleExtensions
    ) {
      const candidate =
        `${basePath}.${ext}`;

      if (
        existsSync(candidate)
      ) {
        sourcePath =
          candidate;
        break;
      }
    }

    /*
     * Fallback:
     * cari file dengan prefix basePath.
     */
    if (!sourcePath) {
      try {
        const files =
          readdirSync(tmpdir());

        const prefix =
          `neura_${uniqueId}.`;

        const found =
          files.find(
            (file) =>
              file.startsWith(prefix) &&
              !file.endsWith(".mp3")
          );

        if (found) {
          sourcePath =
            join(
              tmpdir(),
              found
            );
        }
      } catch {}
    }

    if (
      !sourcePath ||
      !existsSync(sourcePath)
    ) {
      throw new Error(
        "File audio hasil yt-dlp tidak ditemukan."
      );
    }

    console.log(
      "[PLAY] Source audio:",
      sourcePath
    );

    /* =====================================================
     * 3. FFMPEG
     * =================================================== */

    console.log(
      "[PLAY] Convert menggunakan FFmpeg..."
    );

    const ffmpegArgs = [
      "-y",

      /*
       * Input audio.
       */
      "-i",
      sourcePath,

      /*
       * Jangan masukkan video.
       */
      "-vn",

      /*
       * MP3 encoder.
       */
      "-c:a",
      "libmp3lame",

      /*
       * VBR quality.
       *
       * 0 = kualitas tertinggi.
       * 2 = sangat baik dan ukuran lebih kecil.
       */
      "-q:a",
      "2",

      /*
       * Metadata tidak perlu dibawa.
       */
      "-map_metadata",
      "-1",

      outputPath,
    ];

    const ffmpegResult =
      await execFileAsync(
        ffmpegPath,
        ffmpegArgs,
        {
          maxBuffer:
            50 * 1024 * 1024,

          timeout:
            180000,

          windowsHide:
            true,
        }
      );

    if (
      ffmpegResult?.stderr
    ) {
      console.log(
        "[FFMPEG]",
        ffmpegResult.stderr
      );
    }

    /* =====================================================
     * 4. VALIDASI MP3
     * =================================================== */

    if (
      !existsSync(outputPath)
    ) {
      throw new Error(
        "FFmpeg tidak menghasilkan file MP3."
      );
    }

    const buffer =
      readFileSync(outputPath);

    if (
      !buffer ||
      buffer.length === 0
    ) {
      throw new Error(
        "File MP3 kosong."
      );
    }

    console.log(
      "[PLAY] MP3 berhasil dibuat:",
      buffer.length,
      "bytes"
    );

    /* =====================================================
     * 5. CLEANUP
     * =================================================== */

    cleanupFile(sourcePath);
    cleanupFile(outputPath);

    return {
      buffer,
    };
  } catch (err) {
    console.error(
      "[PLAY DOWNLOAD ERROR]",
      err?.message
    );

    if (err?.stdout) {
      console.error(
        "[PLAY STDOUT]",
        err.stdout
      );
    }

    if (err?.stderr) {
      console.error(
        "[PLAY STDERR]",
        err.stderr
      );
    }

    cleanupFile(sourcePath);
    cleanupFile(outputPath);
    cleanupTempFiles(basePath);

    throw new Error(
      err?.message ||
        "Gagal mengunduh audio."
    );
  }
};

/* =========================================================
 * ERROR RESPONSE
 * ======================================================= */

const sendPlayError = async (
  conn,
  chat,
  m
) => {
  return sendFancyText(
    conn,
    chat,
    {
      title:
        config.BotName,

      body:
        `Developer By ${config.OwnerName}`,

      thumbnail,

      text:
        config.message.notFound ||
        "Lagu tidak dapat ditemukan atau diunduh.",

      msg: m,
    }
  );
};

/* =========================================================
 * HANDLER
 * ======================================================= */

const handler = async (
  m,
  { conn }
) => {
  try {
    /* =====================================================
     * QUERY
     * =================================================== */

    const query =
      String(m.text || "")
        .replace(
          /^(\.play|\.music|\.p)\s*/i,
          ""
        )
        .trim();

    if (!query) {
      return sendText(
        conn,
        m.chat,
        "Masukkan judul lagu\nContoh: .play Dia Anji",
        m
      );
    }

    await reactMessage(
      conn,
      m.chat,
      m,
      "🔍"
    );

    let video = null;

    /* =====================================================
     * DIRECT VIDEO ID
     * =================================================== */

    if (
      /^id:/i.test(query)
    ) {
      const videoId =
        query
          .replace(
            /^id:/i,
            ""
          )
          .trim();

      if (
        !isValidVideoId(
          videoId
        )
      ) {
        return sendText(
          conn,
          m.chat,
          "Video ID YouTube tidak valid.",
          m
        );
      }

      const videoUrl =
        `https://www.youtube.com/watch?v=${videoId}`;

      const meta =
        await fetchVideoMeta(
          videoUrl
        );

      video = {
        url: videoUrl,

        title:
          meta.title,

        thumbnail:
          meta.thumbnail,

        timestamp:
          meta.timestamp,

        views:
          meta.views,

        author:
          meta.author,
      };
    }

    /* =====================================================
     * SEARCH YOUTUBE
     * =================================================== */

    else {
      const searchRes =
        await axios.get(
          "https://api.siputzx.my.id/api/s/youtube",
          {
            params: {
              query,
            },

            timeout: 30000,
          }
        );

      const searchData =
        searchRes?.data;

      console.log(
        "[PLAY SEARCH API]",
        searchData
      );

      const videos =
        Array.isArray(
          searchData?.data
        )
          ? searchData.data.filter(
              (item) =>
                item?.type ===
                  "video" &&
                item?.videoId
            )
          : [];

      if (
        !searchData?.status ||
        videos.length === 0
      ) {
        return sendPlayError(
          conn,
          m.chat,
          m
        );
      }

      const results =
        videos.slice(0, 10);

      await conn.sendButton(
        m.chat,
        {
          text:
            `Ditemukan ${results.length} hasil untuk *${query}*\n\n` +
            "Silahkan pilih salah satu lagu di bawah ini.",

          footer:
            config.OwnerName,

          buttons: [
            buildSelectButton(
              "Daftar Lagu",
              "Silahkan pilih salah satu",

              results.map(
                (item) => ({
                  title:
                    item.title ||
                    "Unknown Title",

                  description:
                    `${item.author?.name || "-"} • ` +
                    `${item.timestamp || "-"} • ` +
                    `${item.views ?? "-"} views`,

                  id:
                    `.play id:${item.videoId}`,
                })
              )
            ),
          ],

          bottom_sheet:
            true,

          bottom_name:
            "Menu Musik",
        }
      );

      return;
    }

    /* =====================================================
     * DOWNLOAD
     * =================================================== */

    await reactMessage(
      conn,
      m.chat,
      m,
      "⬇️"
    );

    let audio;

    try {
      audio =
        await downloadAudio(
          video.url
        );
    } catch (err) {
      console.error(
        "[PLAY DOWNLOAD ERROR]",
        err
      );

      return sendPlayError(
        conn,
        m.chat,
        m
      );
    }

    if (
      !audio?.buffer ||
      !Buffer.isBuffer(
        audio.buffer
      ) ||
      audio.buffer.length === 0
    ) {
      return sendPlayError(
        conn,
        m.chat,
        m
      );
    }

    /* =====================================================
     * METADATA
     *
     * Metadata utama berasal dari hasil
     * search/oEmbed karena downloader sekarang
     * fokus mengambil audio source.
     * =================================================== */

    const title =
      video.title ||
      "Unknown Title";

    const duration =
      video.timestamp ||
      "-";

    const displayThumbnail =
      video.thumbnail ||
      thumbnail;

    const authorName =
      video.author?.name ||
      "-";

    const views =
      video.views ??
      "-";

    /* =====================================================
     * SEND INFORMATION
     * =================================================== */

    try {
      await sendFancyTextModif(
        conn,
        m.chat,
        {
          image:
            displayThumbnail,

          caption:
            `🎵 ${title}\n` +
            `📺 Channel: ${authorName}\n` +
            `⏱️ Durasi: ${duration}\n` +
            `👁️ Views: ${views}`,

          quoted: m,
        }
      );
    } catch (err) {
      /*
       * Jika thumbnail gagal,
       * audio tetap dikirim.
       */
      console.error(
        "[PLAY INFO MESSAGE ERROR]",
        err?.message
      );
    }

    /* =====================================================
     * SEND AUDIO
     * =================================================== */

    await reactMessage(
      conn,
      m.chat,
      m,
      "🎵"
    );

    await conn.sendMessage(
      m.chat,
      {
        audio:
          audio.buffer,

        mimetype:
          "audio/mpeg",

        fileName:
          `${safeFileName(title)}.mp3`,

        ptt: false,
      },
      {
        quoted: m,
      }
    );

    /* =====================================================
     * SUCCESS
     * =================================================== */

    await reactMessage(
      conn,
      m.chat,
      m,
      "✅"
    );
  } catch (err) {
    console.error(
      "[PLAY ERROR]",
      err
    );

    try {
      await sendText(
        conn,
        m.chat,
        config.message.error ||
          "Terjadi kesalahan saat memproses lagu.",
        m
      );
    } catch (sendError) {
      console.error(
        "[PLAY SEND ERROR]",
        sendError
      );
    }
  }
};

/* =========================================================
 * HANDLER CONFIG
 * ======================================================= */

handler.command = "play";
handler.alias = [
  "music",
  "p",
];
handler.category =
  "Menu Tools";
handler.submenu =
  "Tools";
export default handler;
