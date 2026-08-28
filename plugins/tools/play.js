import axios from "axios";
import { execFile, execSync } from "child_process";
import { promisify } from "util";
import {
  readFileSync,
  unlinkSync,
  existsSync,
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
 * YT-DLP
 * ======================================================= */

let ytDlpPath = "yt-dlp";

try {
  ytDlpPath = execSync("which yt-dlp", {
    encoding: "utf8",
  }).trim();

  if (!ytDlpPath) {
    ytDlpPath = "yt-dlp";
  }
} catch {
  console.error(
    "[YT-DLP] yt-dlp tidak ditemukan di PATH."
  );
  console.error(
    "[YT-DLP] Install dengan: pip install -U yt-dlp"
  );
}

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

  const totalSeconds = Math.floor(Number(durationSeconds));

  if (
    Number.isNaN(totalSeconds) ||
    totalSeconds < 0
  ) {
    return "-";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }

  return `${minutes}:${ss}`;
};

const safeFileName = (name) => {
  return String(name || "audio")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "audio";
};

/* =========================================================
 * YOUTUBE OEMBED
 * ======================================================= */

const fetchVideoMeta = async (videoUrl) => {
  try {
    const response = await axios.get(
      "https://www.youtube.com/oembed",
      {
        params: {
          url: videoUrl,
          format: "json",
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    return {
      title: data?.title || "Unknown Title",
      thumbnail:
        data?.thumbnail_url || thumbnail,
      author: {
        name: data?.author_name || "-",
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
 * DOWNLOAD AUDIO
 * ======================================================= */

const downloadAudioWithYtDlp = async (videoUrl) => {
  const uniqueId =
    `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

  const outputBase = join(
    tmpdir(),
    `neura_${uniqueId}`
  );

  const outputTemplate =
    `${outputBase}.%(ext)s`;

  let outputPath = null;

  const args = [
    "--extract-audio",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "0",

    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--ignore-config",

    /*
     * Jangan hanya mengandalkan finalPath.
     * yt-dlp akan mengembalikan path aktual
     * setelah proses post-processing selesai.
     */
    "--print",
    "after_move:filepath",

    "--print",
    "json",

    "-o",
    outputTemplate,

    videoUrl,
  ];

  try {
    console.log(
      "[YT-DLP] Download:",
      videoUrl
    );

    const result = await execFileAsync(
      ytDlpPath,
      args,
      {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 180000,
        windowsHide: true,
      }
    );

    const stdout = String(
      result?.stdout || ""
    ).trim();

    const stderr = String(
      result?.stderr || ""
    ).trim();

    if (stderr) {
      console.log(
        "[YT-DLP STDERR]",
        stderr
      );
    }

    /*
     * after_move:filepath menghasilkan path
     * file setelah post-processing.
     *
     * Ambil baris yang berakhiran .mp3.
     */
    const lines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    outputPath =
      [...lines]
        .reverse()
        .find((line) =>
          /\.mp3$/i.test(line)
        ) || null;

    /*
     * Fallback apabila output path tidak
     * berhasil ditemukan dari stdout.
     */
    if (
      !outputPath ||
      !existsSync(outputPath)
    ) {
      const fallbackPath =
        `${outputBase}.mp3`;

      if (existsSync(fallbackPath)) {
        outputPath = fallbackPath;
      }
    }

    if (
      !outputPath ||
      !existsSync(outputPath)
    ) {
      console.error(
        "[YT-DLP] Output tidak ditemukan."
      );
      console.error(
        "[YT-DLP STDOUT]",
        stdout
      );

      throw new Error(
        "File MP3 hasil yt-dlp tidak ditemukan."
      );
    }

    /*
     * Parse metadata JSON.
     *
     * --print json bisa menghasilkan JSON
     * di antara output lainnya, jadi cari
     * baris yang valid JSON object.
     */
    let info = {};

    for (
      let i = lines.length - 1;
      i >= 0;
      i--
    ) {
      const line = lines[i];

      if (
        !line.startsWith("{") ||
        !line.endsWith("}")
      ) {
        continue;
      }

      try {
        const parsed = JSON.parse(line);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          info = parsed;
          break;
        }
      } catch {
        // lanjut cari JSON berikutnya
      }
    }

    const buffer = readFileSync(
      outputPath
    );

    /*
     * Hapus file temporary setelah dibaca.
     */
    try {
      unlinkSync(outputPath);
    } catch (cleanupError) {
      console.error(
        "[YT-DLP CLEANUP ERROR]",
        cleanupError?.message
      );
    }

    return {
      buffer,

      title:
        info?.title ||
        "Unknown Title",

      duration:
        formatDuration(info?.duration),

      thumbnail:
        info?.thumbnail ||
        null,

      uploader:
        info?.uploader ||
        info?.channel ||
        null,

      viewCount:
        info?.view_count ??
        info?.viewCount ??
        null,
    };
  } catch (err) {
    console.error(
      "[YT-DLP ERROR]",
      err?.message
    );

    if (err?.stdout) {
      console.error(
        "[YT-DLP STDOUT]",
        err.stdout
      );
    }

    if (err?.stderr) {
      console.error(
        "[YT-DLP STDERR]",
        err.stderr
      );
    }

    /*
     * Bersihkan file temporary apabila
     * proses gagal.
     */
    if (
      outputPath &&
      existsSync(outputPath)
    ) {
      try {
        unlinkSync(outputPath);
      } catch {}
    }

    /*
     * Coba bersihkan kemungkinan file
     * dengan beberapa extension.
     */
    const possibleFiles = [
      `${outputBase}.mp3`,
      `${outputBase}.m4a`,
      `${outputBase}.webm`,
      `${outputBase}.opus`,
      `${outputBase}.mp4`,
    ];

    for (const file of possibleFiles) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch {}
      }
    }

    throw new Error(
      `yt-dlp gagal mengunduh audio: ${
        err?.stderr ||
        err?.message ||
        "Unknown error"
      }`
    );
  }
};

/* =========================================================
 * ERROR MESSAGE
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
      title: config.BotName,
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
    const query = String(
      m.text || ""
    )
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

    let video;

    /* =====================================================
     * PILIH VIDEO DARI ID
     * =================================================== */

    if (/^id:/i.test(query)) {
      const videoId = query
        .replace(/^id:/i, "")
        .trim();

      if (
        !isValidVideoId(videoId)
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
        title: meta.title,
        thumbnail: meta.thumbnail,
        timestamp: meta.timestamp,
        views: meta.views,
        author: meta.author,
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
            `Silahkan pilih salah satu lagu di bawah ini.`,
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
          bottom_sheet: true,
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

    let downloadInfo;

    try {
      downloadInfo =
        await downloadAudioWithYtDlp(
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
      !downloadInfo?.buffer ||
      !Buffer.isBuffer(
        downloadInfo.buffer
      ) ||
      downloadInfo.buffer.length === 0
    ) {
      return sendPlayError(
        conn,
        m.chat,
        m
      );
    }

    /* =====================================================
     * METADATA
     * =================================================== */

    const title =
      downloadInfo.title ||
      video.title ||
      "Unknown Title";

    const duration =
      downloadInfo.duration ||
      video.timestamp ||
      "-";

    const displayThumbnail =
      downloadInfo.thumbnail ||
      video.thumbnail ||
      thumbnail;

    const authorName =
      downloadInfo.uploader ||
      video.author?.name ||
      "-";

    const views =
      downloadInfo.viewCount ??
      video.views ??
      "-";

    /* =====================================================
     * SEND INFO
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
      console.error(
        "[PLAY INFO MESSAGE ERROR]",
        err?.message
      );

      /*
       * Jangan gagalkan pengiriman audio
       * hanya karena thumbnail/info gagal.
       */
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
          downloadInfo.buffer,

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
handler.category = "Menu Tools";
handler.submenu = "Tools";

export default handler;
