// import axios from "axios";
// import { execSync } from "child_process";
// import ffmpeg from "fluent-ffmpeg";
// import {
//   readFileSync,
//   unlinkSync,
//   existsSync,
// } from "fs";
// import { join } from "path";
// import { tmpdir } from "os";

// import {
//   reactMessage,
//   sendFancyText,
//   sendFancyTextModif,
//   sendText,
//   buildSelectButton,
// } from "../../src/config/message.js";

// import { config, thumbnail } from "../../config.js";

// /* =========================================================
//  * BINARY FFMPEG
//  * ======================================================= */

// let ffmpegPath = "ffmpeg";

// try {
//   const detectedFfmpeg = execSync("which ffmpeg", {
//     encoding: "utf8",
//   }).trim();

//   if (detectedFfmpeg) {
//     ffmpegPath = detectedFfmpeg;
//   }
// } catch {
//   console.error(
//     "[FFMPEG] ffmpeg tidak ditemukan di PATH."
//   );
// }

// ffmpeg.setFfmpegPath(ffmpegPath);

// console.log("[PLAY] ffmpeg:", ffmpegPath);

// /* =========================================================
//  * HELPERS
//  * ======================================================= */

// const isValidVideoId = (id) => {
//   return /^[a-zA-Z0-9_-]{11}$/.test(id);
// };

// const safeFileName = (name) => {
//   return String(name || "audio")
//     .replace(
//       /[<>:"/\\|?*\x00-\x1F]/g,
//       ""
//     )
//     .replace(/\s+/g, " ")
//     .trim()
//     .slice(0, 180) || "audio";
// };

// const cleanupFile = (file) => {
//   if (!file) return;

//   try {
//     if (existsSync(file)) {
//       unlinkSync(file);
//     }
//   } catch (err) {
//     console.error(
//       "[PLAY CLEANUP ERROR]",
//       file,
//       err?.message
//     );
//   }
// };

// /* =========================================================
//  * YOUTUBE OEMBED
//  * ======================================================= */

// const fetchVideoMeta = async (
//   videoUrl
// ) => {
//   try {
//     const response =
//       await axios.get(
//         "https://www.youtube.com/oembed",
//         {
//           params: {
//             url: videoUrl,
//             format: "json",
//           },
//           timeout: 15000,
//         }
//       );

//     const data =
//       response?.data;

//     return {
//       title:
//         data?.title ||
//         "Unknown Title",

//       thumbnail:
//         data?.thumbnail_url ||
//         thumbnail,

//       author: {
//         name:
//           data?.author_name ||
//           "-",
//       },

//       timestamp: "-",
//       views: "-",
//     };
//   } catch (err) {
//     console.error(
//       "[PLAY OEMBED ERROR]",
//       err?.message
//     );

//     return {
//       title: "Unknown Title",
//       thumbnail,

//       author: {
//         name: "-",
//       },

//       timestamp: "-",
//       views: "-",
//     };
//   }
// };

// /* =========================================================
//  * RESOLVE DIRECT AUDIO URL (via API savefrom)
//  * ======================================================= */

// const collectFormatCandidates = (
//   node,
//   candidates,
//   depth = 0
// ) => {
//   if (
//     !node ||
//     typeof node !== "object" ||
//     depth > 12
//   ) {
//     return;
//   }

//   if (Array.isArray(node)) {
//     for (const item of node) {
//       collectFormatCandidates(
//         item,
//         candidates,
//         depth + 1
//       );
//     }
//     return;
//   }

//   if (
//     typeof node.url === "string" &&
//     /^https?:\/\//i.test(node.url)
//   ) {
//     candidates.push(node);
//   }

//   for (const key of Object.keys(node)) {
//     if (
//       key === "url" &&
//       typeof node.url === "string"
//     ) {
//       continue;
//     }

//     collectFormatCandidates(
//       node[key],
//       candidates,
//       depth + 1
//     );
//   }
// };

// const scoreFormatCandidate = (
//   candidate
// ) => {
//   const type = (
//     candidate.type || ""
//   )
//     .toString()
//     .toLowerCase();

//   const ext = (
//     candidate.ext || ""
//   )
//     .toString()
//     .toLowerCase();

//   const quality =
//     parseInt(
//       candidate.qualityNumber,
//       10
//     ) ||
//     parseInt(
//       candidate.quality,
//       10
//     ) ||
//     0;

//   if (
//     type.includes("mp3") ||
//     ext === "mp3"
//   ) {
//     return 3000 + quality;
//   }

//   if (
//     type.includes("opus") ||
//     ext === "opus"
//   ) {
//     return 2000 + quality;
//   }

//   if (
//     type.includes("m4a") ||
//     ext === "m4a" ||
//     type.includes("audio")
//   ) {
//     return 2000 + quality;
//   }

//   if (candidate.audio === true) {
//     return 1500 + quality;
//   }

//   if (
//     candidate.downloadable === true
//   ) {
//     return 500 + quality;
//   }

//   return quality;
// };

// const findMetaInfo = (
//   node,
//   depth = 0
// ) => {
//   if (
//     !node ||
//     typeof node !== "object" ||
//     depth > 12
//   ) {
//     return null;
//   }

//   if (Array.isArray(node)) {
//     for (const item of node) {
//       const result = findMetaInfo(
//         item,
//         depth + 1
//       );

//       if (result) return result;
//     }
//     return null;
//   }

//   if (
//     node.meta &&
//     typeof node.meta === "object" &&
//     node.meta.title
//   ) {
//     return {
//       title:
//         node.meta.title || null,

//       duration:
//         node.meta.duration || null,

//       thumb:
//         node.thumb ||
//         node.thumbnail ||
//         node.image ||
//         null,
//     };
//   }

//   if (
//     typeof node.title === "string" &&
//     node.title.trim()
//   ) {
//     return {
//       title: node.title,

//       duration:
//         node.duration ||
//         node.timestamp ||
//         null,

//       thumb:
//         node.thumb ||
//         node.thumbnail ||
//         node.image ||
//         null,
//     };
//   }

//   for (const key of Object.keys(node)) {
//     const result = findMetaInfo(
//       node[key],
//       depth + 1
//     );

//     if (result) return result;
//   }

//   return null;
// };

// const resolveDirectAudioUrl = async (
//   videoUrl
// ) => {
//   const dlRes = await axios.get(
//     "https://api.siputzx.my.id/api/d/savefrom",
//     {
//       params: {
//         url: videoUrl,
//       },
//       timeout: 30000,
//     }
//   );

//   const dlData = dlRes?.data;

//   console.log(
//     "[PLAY DOWNLOAD API]",
//     JSON.stringify(dlData).slice(0, 2000)
//   );

//   if (!dlData?.status) {
//     throw new Error(
//       "API resolver gagal mengambil data audio."
//     );
//   }

//   const candidates = [];

//   collectFormatCandidates(
//     dlData?.data,
//     candidates
//   );

//   if (candidates.length === 0) {
//     throw new Error(
//       "Tidak ditemukan format audio yang valid."
//     );
//   }

//   const usableCandidates =
//     candidates.filter(
//       (c) =>
//         !c.url.includes(
//           "local-converter"
//         )
//     );

//   const finalCandidates =
//     usableCandidates.length > 0
//       ? usableCandidates
//       : candidates;

//   finalCandidates.sort(
//     (a, b) =>
//       scoreFormatCandidate(b) -
//       scoreFormatCandidate(a)
//   );

//   const bestFormat =
//     finalCandidates[0];

//   if (!bestFormat?.url) {
//     throw new Error(
//       "URL audio tidak ditemukan pada hasil resolver."
//     );
//   }

//   const meta =
//     findMetaInfo(dlData?.data) || {};

//   return {
//     downloadUrl: bestFormat.url,
//     title: meta.title || null,
//     duration: meta.duration || null,
//     thumb: meta.thumb || null,
//   };
// };

// /* =========================================================
//  * CONVERT KE MP3 (fluent-ffmpeg)
//  * ======================================================= */

// /*
//  * Konversi langsung dari URL remote.
//  *
//  * FFmpeg yang menangani proses download +
//  * decode + encode ke MP3 sekaligus (streaming),
//  * tanpa perlu file mentah lokal.
//  */
// const convertRemoteUrlToMp3 = (
//   sourceUrl,
//   outputPath
// ) => {
//   return new Promise((resolve, reject) => {
//     ffmpeg(sourceUrl)
//       .inputOptions([
//         "-user_agent",
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
//         "-reconnect",
//         "1",
//         "-reconnect_streamed",
//         "1",
//         "-reconnect_delay_max",
//         "5",
//         "-rw_timeout",
//         "30000000",
//       ])
//       .noVideo()
//       .audioCodec("libmp3lame")
//       .audioQuality(2)
//       .outputOptions([
//         "-ar",
//         "44100",
//         "-ac",
//         "2",
//         "-map_metadata",
//         "-1",
//       ])
//       .format("mp3")
//       .on("stderr", (line) => {
//         console.log(
//           "[FFMPEG STREAM]",
//           line
//         );
//       })
//       .on("error", (err) => {
//         reject(err);
//       })
//       .on("end", () => {
//         resolve();
//       })
//       .save(outputPath);
//   });
// };

// /*
//  * Fallback: konversi dari file lokal
//  * (dipakai kalau streaming langsung dari URL gagal).
//  */
// const convertLocalFileToMp3 = (
//   inputPath,
//   outputPath
// ) => {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .noVideo()
//       .audioCodec("libmp3lame")
//       .audioQuality(2)
//       .outputOptions([
//         "-ar",
//         "44100",
//         "-ac",
//         "2",
//         "-map_metadata",
//         "-1",
//       ])
//       .format("mp3")
//       .on("stderr", (line) => {
//         console.log(
//           "[FFMPEG LOCAL]",
//           line
//         );
//       })
//       .on("error", (err) => {
//         reject(err);
//       })
//       .on("end", () => {
//         resolve();
//       })
//       .save(outputPath);
//   });
// };

// /* =========================================================
//  * DOWNLOAD AUDIO (ffmpeg only, tanpa yt-dlp)
//  * ======================================================= */

// const downloadAudio = async (
//   videoUrl
// ) => {
//   const uniqueId =
//     `${Date.now()}_${Math.random()
//       .toString(36)
//       .slice(2)}`;

//   const rawPath = join(
//     tmpdir(),
//     `neura_${uniqueId}_raw`
//   );

//   const outputPath = join(
//     tmpdir(),
//     `neura_${uniqueId}.mp3`
//   );

//   try {
//     console.log(
//       "[PLAY] Resolve URL audio:",
//       videoUrl
//     );

//     const downloadInfo =
//       await resolveDirectAudioUrl(
//         videoUrl
//       );

//     console.log(
//       "[PLAY] Direct audio URL ditemukan."
//     );

//     /* =====================================================
//      * 1. COBA STREAMING LANGSUNG VIA FFMPEG
//      * =================================================== */

//     try {
//       await convertRemoteUrlToMp3(
//         downloadInfo.downloadUrl,
//         outputPath
//       );
//     } catch (err) {
//       console.error(
//         "[FFMPEG STREAM ERROR] Fallback ke download manual:",
//         err?.message
//       );

//       /* =================================================
//        * 2. FALLBACK: DOWNLOAD FILE MENTAH DULU,
//        *    LALU CONVERT LOKAL
//        * =============================================== */

//       const rawRes =
//         await axios.get(
//           downloadInfo.downloadUrl,
//           {
//             responseType:
//               "arraybuffer",

//             timeout: 60000,

//             maxContentLength:
//               Infinity,

//             maxBodyLength:
//               Infinity,

//             headers: {
//               "User-Agent":
//                 "Mozilla/5.0",
//             },
//           }
//         );

//       const { writeFileSync } =
//         await import("fs");

//       writeFileSync(
//         rawPath,
//         Buffer.from(rawRes.data)
//       );

//       await convertLocalFileToMp3(
//         rawPath,
//         outputPath
//       );
//     }

//     /* =====================================================
//      * 3. VALIDASI MP3
//      * =================================================== */

//     if (!existsSync(outputPath)) {
//       throw new Error(
//         "FFmpeg tidak menghasilkan file MP3."
//       );
//     }

//     const buffer =
//       readFileSync(outputPath);

//     if (!buffer || buffer.length === 0) {
//       throw new Error(
//         "File MP3 kosong."
//       );
//     }

//     console.log(
//       "[PLAY] MP3 berhasil dibuat:",
//       buffer.length,
//       "bytes"
//     );

//     /* =====================================================
//      * 4. CLEANUP
//      * =================================================== */

//     cleanupFile(rawPath);
//     cleanupFile(outputPath);

//     return {
//       buffer,
//       title: downloadInfo.title,
//       duration: downloadInfo.duration,
//       thumb: downloadInfo.thumb,
//     };
//   } catch (err) {
//     console.error(
//       "[PLAY DOWNLOAD ERROR]",
//       err?.message
//     );

//     cleanupFile(rawPath);
//     cleanupFile(outputPath);

//     throw new Error(
//       err?.message ||
//         "Gagal mengunduh audio."
//     );
//   }
// };

// /* =========================================================
//  * ERROR RESPONSE
//  * ======================================================= */

// const sendPlayError = async (
//   conn,
//   chat,
//   m
// ) => {
//   return sendFancyText(
//     conn,
//     chat,
//     {
//       title:
//         config.BotName,

//       body:
//         `Developer By ${config.OwnerName}`,

//       thumbnail,

//       text:
//         config.message.notFound ||
//         "Lagu tidak dapat ditemukan atau diunduh.",

//       msg: m,
//     }
//   );
// };

// /* =========================================================
//  * HANDLER
//  * ======================================================= */

// const handler = async (
//   m,
//   { conn }
// ) => {
//   try {
//     /* =====================================================
//      * QUERY
//      * =================================================== */

//     const query =
//       String(m.text || "")
//         .replace(
//           /^(\.play|\.music|\.p)\s*/i,
//           ""
//         )
//         .trim();

//     if (!query) {
//       return sendText(
//         conn,
//         m.chat,
//         "Masukkan judul lagu\nContoh: .play Dia Anji",
//         m
//       );
//     }

//     await reactMessage(
//       conn,
//       m.chat,
//       m,
//       "🔍"
//     );

//     let video = null;

//     /* =====================================================
//      * DIRECT VIDEO ID
//      * =================================================== */

//     if (
//       /^id:/i.test(query)
//     ) {
//       const videoId =
//         query
//           .replace(
//             /^id:/i,
//             ""
//           )
//           .trim();

//       if (
//         !isValidVideoId(
//           videoId
//         )
//       ) {
//         return sendText(
//           conn,
//           m.chat,
//           "Video ID YouTube tidak valid.",
//           m
//         );
//       }

//       const videoUrl =
//         `https://www.youtube.com/watch?v=${videoId}`;

//       const meta =
//         await fetchVideoMeta(
//           videoUrl
//         );

//       video = {
//         url: videoUrl,

//         title:
//           meta.title,

//         thumbnail:
//           meta.thumbnail,

//         timestamp:
//           meta.timestamp,

//         views:
//           meta.views,

//         author:
//           meta.author,
//       };
//     }

//     /* =====================================================
//      * SEARCH YOUTUBE
//      * =================================================== */

//     else {
//       const searchRes =
//         await axios.get(
//           "https://api.siputzx.my.id/api/s/youtube",
//           {
//             params: {
//               query,
//             },

//             timeout: 30000,
//           }
//         );

//       const searchData =
//         searchRes?.data;

//       console.log(
//         "[PLAY SEARCH API]",
//         searchData
//       );

//       const videos =
//         Array.isArray(
//           searchData?.data
//         )
//           ? searchData.data.filter(
//               (item) =>
//                 item?.type ===
//                   "video" &&
//                 item?.videoId
//             )
//           : [];

//       if (
//         !searchData?.status ||
//         videos.length === 0
//       ) {
//         return sendPlayError(
//           conn,
//           m.chat,
//           m
//         );
//       }

//       const results =
//         videos.slice(0, 10);

//       await conn.sendButton(
//         m.chat,
//         {
//           text:
//             `Ditemukan ${results.length} hasil untuk *${query}*\n\n` +
//             "Silahkan pilih salah satu lagu di bawah ini.",

//           footer:
//             config.OwnerName,

//           buttons: [
//             buildSelectButton(
//               "Daftar Lagu",
//               "Silahkan pilih salah satu",

//               results.map(
//                 (item) => ({
//                   title:
//                     item.title ||
//                     "Unknown Title",

//                   description:
//                     `${item.author?.name || "-"} • ` +
//                     `${item.timestamp || "-"} • ` +
//                     `${item.views ?? "-"} views`,

//                   id:
//                     `.play id:${item.videoId}`,
//                 })
//               )
//             ),
//           ],

//           bottom_sheet:
//             true,

//           bottom_name:
//             "Menu Musik",
//         }
//       );

//       return;
//     }

//     /* =====================================================
//      * DOWNLOAD
//      * =================================================== */

//     await reactMessage(
//       conn,
//       m.chat,
//       m,
//       "⬇️"
//     );

//     let audio;

//     try {
//       audio =
//         await downloadAudio(
//           video.url
//         );
//     } catch (err) {
//       console.error(
//         "[PLAY DOWNLOAD ERROR]",
//         err
//       );

//       return sendPlayError(
//         conn,
//         m.chat,
//         m
//       );
//     }

//     if (
//       !audio?.buffer ||
//       !Buffer.isBuffer(
//         audio.buffer
//       ) ||
//       audio.buffer.length === 0
//     ) {
//       return sendPlayError(
//         conn,
//         m.chat,
//         m
//       );
//     }

//     /* =====================================================
//      * METADATA
//      *
//      * Prioritas: metadata dari resolver savefrom,
//      * fallback ke metadata dari search/oEmbed.
//      * =================================================== */

//     const title =
//       audio.title ||
//       video.title ||
//       "Unknown Title";

//     const duration =
//       audio.duration ||
//       video.timestamp ||
//       "-";

//     const displayThumbnail =
//       audio.thumb ||
//       video.thumbnail ||
//       thumbnail;

//     const authorName =
//       video.author?.name ||
//       "-";

//     const views =
//       video.views ??
//       "-";

//     /* =====================================================
//      * SEND INFORMATION
//      * =================================================== */

//     try {
//       await sendFancyTextModif(
//         conn,
//         m.chat,
//         {
//           image:
//             displayThumbnail,

//           caption:
//             `🎵 ${title}\n` +
//             `📺 Channel: ${authorName}\n` +
//             `⏱️ Durasi: ${duration}\n` +
//             `👁️ Views: ${views}`,

//           quoted: m,
//         }
//       );
//     } catch (err) {
//       /*
//        * Jika thumbnail gagal,
//        * audio tetap dikirim.
//        */
//       console.error(
//         "[PLAY INFO MESSAGE ERROR]",
//         err?.message
//       );
//     }

//     /* =====================================================
//      * SEND AUDIO
//      * =================================================== */

//     await reactMessage(
//       conn,
//       m.chat,
//       m,
//       "🎵"
//     );

//     await conn.sendMessage(
//       m.chat,
//       {
//         audio:
//           audio.buffer,

//         mimetype:
//           "audio/mpeg",

//         fileName:
//           `${safeFileName(title)}.mp3`,

//         ptt: false,
//       },
//       {
//         quoted: m,
//       }
//     );

//     /* =====================================================
//      * SUCCESS
//      * =================================================== */

//     await reactMessage(
//       conn,
//       m.chat,
//       m,
//       "✅"
//     );
//   } catch (err) {
//     console.error(
//       "[PLAY ERROR]",
//       err
//     );

//     try {
//       await sendText(
//         conn,
//         m.chat,
//         config.message.error ||
//           "Terjadi kesalahan saat memproses lagu.",
//         m
//       );
//     } catch (sendError) {
//       console.error(
//         "[PLAY SEND ERROR]",
//         sendError
//       );
//     }
//   }
// };

// /* =========================================================
//  * HANDLER CONFIG
//  * ======================================================= */

// handler.command = "play";
// handler.alias = [
//   "music",
//   "p",
// ];
// handler.category =
//   "Menu Tools";
// handler.submenu =
//   "Tools";
// export default handler;
