// import axios from "axios";
// import ffmpeg from "fluent-ffmpeg";
// import { execSync } from "child_process";
// import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
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
// try {
//   const path = execSync("which ffmpeg").toString().trim();
//   ffmpeg.setFfmpegPath(path);
// } catch {}

// const convertToMp3 = (inputBuffer) => {
//   return new Promise((resolve, reject) => {
//     const tmpIn = join(tmpdir(), `neura_${Date.now()}.mp3`);
//     const tmpOut = join(tmpdir(), `neura_${Date.now()}_fixed.mp3`);
//     const cleanup = () => {
//       if (existsSync(tmpIn)) unlinkSync(tmpIn);
//       if (existsSync(tmpOut)) unlinkSync(tmpOut);
//     };
//     try {
//       writeFileSync(tmpIn, inputBuffer);
//       ffmpeg(tmpIn)
//         .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
//         .format("mp3")
//         .on("end", () => {
//           try {
//             const buffer = readFileSync(tmpOut);
//             cleanup();
//             resolve(buffer);
//           } catch (err) {
//             cleanup();
//             reject(err);
//           }
//         })
//         .on("error", (err) => {
//           cleanup();
//           reject(err);
//         })
//         .save(tmpOut);
//     } catch (err) {
//       cleanup();
//       reject(err);
//     }
//   });
// };

// const convertUrlToMp3 = (sourceUrl) => {
//   return new Promise((resolve, reject) => {
//     const tmpOut = join(tmpdir(), `neura_${Date.now()}_stream.mp3`);
//     const cleanup = () => {
//       if (existsSync(tmpOut)) unlinkSync(tmpOut);
//     };
//     try {
//       ffmpeg(sourceUrl)
//         .inputOptions([
//           "-user_agent",
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
//           "-reconnect",
//           "1",
//           "-reconnect_streamed",
//           "1",
//           "-reconnect_delay_max",
//           "5",
//           "-rw_timeout",
//           "30000000",
//         ])
//         .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
//         .format("mp3")
//         .on("end", () => {
//           try {
//             const buffer = readFileSync(tmpOut);
//             cleanup();
//             resolve(buffer);
//           } catch (err) {
//             cleanup();
//             reject(err);
//           }
//         })
//         .on("error", (err) => {
//           cleanup();
//           reject(err);
//         })
//         .save(tmpOut);
//     } catch (err) {
//       cleanup();
//       reject(err);
//     }
//   });
// };

// const fetchVideoMeta = async (videoUrl) => {
//   try {
//     const oembedRes = await axios.get(
//       `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
//       { timeout: 15000 },
//     );
//     const oembedData = oembedRes.data;
//     return {
//       title: oembedData?.title || "Unknown Title",
//       thumbnail: oembedData?.thumbnail_url || thumbnail,
//       author: { name: oembedData?.author_name || "-" },
//       timestamp: "-",
//       views: "-",
//     };
//   } catch (err) {
//     console.log("[PLAY OEMBED ERROR]", err.message);
//     return {
//       title: "Unknown Title",
//       thumbnail,
//       author: { name: "-" },
//       timestamp: "-",
//       views: "-",
//     };
//   }
// };

// const collectFormatCandidates = (node, candidates, depth = 0) => {
//   if (!node || typeof node !== "object" || depth > 12) return;
//   if (Array.isArray(node)) {
//     for (const item of node) collectFormatCandidates(item, candidates, depth + 1);
//     return;
//   }
//   if (typeof node.url === "string" && /^https?:\/\//i.test(node.url)) {
//     candidates.push(node);
//   }
//   for (const key of Object.keys(node)) {
//     if (key === "url" && typeof node.url === "string") continue;
//     collectFormatCandidates(node[key], candidates, depth + 1);
//   }
// };

// const scoreFormatCandidate = (candidate) => {
//   const type = (candidate.type || "").toString().toLowerCase();
//   const ext = (candidate.ext || "").toString().toLowerCase();
//   const quality =
//     parseInt(candidate.qualityNumber, 10) ||
//     parseInt(candidate.quality, 10) ||
//     0;

//   if (type.includes("mp3") || ext === "mp3") return 3000 + quality;
//   if (type.includes("opus") || ext === "opus") return 2000 + quality;
//   if (type.includes("m4a") || ext === "m4a" || type.includes("audio")) {
//     return 2000 + quality;
//   }
//   if (candidate.audio === true) return 1500 + quality;
//   if (candidate.downloadable === true) return 500 + quality;
//   return quality;
// };

// const findMetaInfo = (node, depth = 0) => {
//   if (!node || typeof node !== "object" || depth > 12) return null;
//   if (Array.isArray(node)) {
//     for (const item of node) {
//       const result = findMetaInfo(item, depth + 1);
//       if (result) return result;
//     }
//     return null;
//   }
//   if (node.meta && typeof node.meta === "object" && node.meta.title) {
//     return {
//       title: node.meta.title || null,
//       duration: node.meta.duration || null,
//       thumb: node.thumb || node.thumbnail || node.image || null,
//     };
//   }
//   if (typeof node.title === "string" && node.title.trim()) {
//     return {
//       title: node.title,
//       duration: node.duration || node.timestamp || null,
//       thumb: node.thumb || node.thumbnail || node.image || null,
//     };
//   }
//   for (const key of Object.keys(node)) {
//     const result = findMetaInfo(node[key], depth + 1);
//     if (result) return result;
//   }
//   return null;
// };

// const extractDownloadInfo = (dlData) => {
//   const candidates = [];
//   collectFormatCandidates(dlData?.data, candidates);

//   if (candidates.length === 0) return null;

//   const usableCandidates = candidates.filter(
//     (c) => !c.url.includes("local-converter"),
//   );

//   const finalCandidates =
//     usableCandidates.length > 0 ? usableCandidates : candidates;

//   finalCandidates.sort(
//     (a, b) => scoreFormatCandidate(b) - scoreFormatCandidate(a),
//   );

//   const bestFormat = finalCandidates[0];
//   if (!bestFormat) return null;

//   const meta = findMetaInfo(dlData?.data) || {};

//   return {
//     downloadUrl: bestFormat.url,
//     title: meta.title || null,
//     duration: meta.duration || null,
//     thumb: meta.thumb || null,
//   };
// };

// const handler = async (m, { conn }) => {
//   try {
//     const query = m.text.replace(/^(\.play|\.music|\.p)\s*/i, "").trim();
//     if (!query) {
//       return sendText(
//         conn,
//         m.chat,
//         "Masukkan judul lagu\nContoh: .play Dia Anji",
//         m,
//       );
//     }
//     await reactMessage(conn, m.chat, m, "🔍");

//     let video;

//     const isVideoIdSelection = /^id:/i.test(query);

//     if (isVideoIdSelection) {
//       const videoId = query.replace(/^id:/i, "").trim();
//       if (!videoId) {
//         return sendText(
//           conn,
//           m.chat,
//           "Masukkan judul lagu\nContoh: .play Dia Anji",
//           m,
//         );
//       }
//       const videoUrl = `https://youtube.com/watch?v=${videoId}`;
//       const meta = await fetchVideoMeta(videoUrl);
//       video = {
//         url: videoUrl,
//         title: meta.title,
//         thumbnail: meta.thumbnail,
//         timestamp: meta.timestamp,
//         views: meta.views,
//         author: meta.author,
//       };
//     } else {
//       // 1. Cari video di YouTube
//       const searchRes = await axios.get(
//         `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
//       );
//       const searchData = searchRes.data;
//       console.log("[PLAY SEARCH API]", searchData);

//       const videos =
//         searchData?.data?.filter((item) => item.type === "video") || [];

//       if (!searchData?.status || videos.length === 0) {
//         return sendFancyText(conn, m.chat, {
//           title: config.BotName,
//           body: `Developer By ${config.OwnerName}`,
//           thumbnail,
//           text: config.message.notFound,
//           msg: m,
//         });
//       }

//       const results = videos.slice(0, 10);

//       await conn.sendButton(m.chat, {
//         text: `Ditemukan ${results.length} hasil untuk *${query}*\nSilahkan pilih salah satu lagu di bawah ini`,
//         footer: config.OwnerName,
//         buttons: [
//           buildSelectButton(
//             "Daftar Lagu",
//             "Silahkan pilih salah satu",
//             results.map((item) => ({
//               title: item.title,
//               description: `${item.author?.name || "-"} • ${item.timestamp || "-"} • ${item.views ?? "-"} views`,
//               id: `.play id:${item.videoId}`,
//             })),
//           ),
//         ],
//         bottom_sheet: true,
//         bottom_name: "Menu Musik",
//       });

//       return;
//     }

//     await reactMessage(conn, m.chat, m, "⬇️");

//     // 2. Ambil link download audio dari video yang ditemukan
//     const dlRes = await axios.get(
//       `https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(video.url)}`,
//     );
//     const dlData = dlRes.data;
//     console.log("[PLAY DOWNLOAD API]", JSON.stringify(dlData).slice(0, 2000));

//     if (!dlData?.status) {
//       return sendFancyText(conn, m.chat, {
//         title: config.BotName,
//         body: `Developer By ${config.OwnerName}`,
//         thumbnail,
//         text: config.message.notFound,
//         msg: m,
//       });
//     }

//     const downloadInfo = extractDownloadInfo(dlData);
//     console.log("[PLAY DOWNLOAD INFO]", downloadInfo);

//     if (!downloadInfo?.downloadUrl) {
//       return sendFancyText(conn, m.chat, {
//         title: config.BotName,
//         body: `Developer By ${config.OwnerName}`,
//         thumbnail,
//         text: config.message.notFound,
//         msg: m,
//       });
//     }

//     const title = downloadInfo.title || video.title;
//     const duration = downloadInfo.duration || video.timestamp;
//     const displayThumbnail = downloadInfo.thumb || video.thumbnail || thumbnail;

//     await sendFancyTextModif(conn, m.chat, {
//       image: displayThumbnail,
//       caption: `🎵 ${title}
// 📺 Channel: ${video.author?.name || "-"}
// ⏱️ Durasi: ${duration}
// 👁️ Views: ${video.views ?? "-"}`,
//       quoted: m,
//     });

//     // 3. Konversi/ambil audio langsung lewat ffmpeg dari URL sumbernya
//     let fixedBuffer;
//     try {
//       fixedBuffer = await convertUrlToMp3(downloadInfo.downloadUrl);
//     } catch (err) {
//       console.log(
//         "[FFMPEG STREAM ERROR] Fallback ke axios download:",
//         err.message,
//       );
//       try {
//         const audioRes = await axios.get(downloadInfo.downloadUrl, {
//           responseType: "arraybuffer",
//           timeout: 60000,
//           maxContentLength: Infinity,
//           maxBodyLength: Infinity,
//           headers: {
//             "User-Agent": "Mozilla/5.0",
//           },
//         });
//         const mp3Buffer = Buffer.from(audioRes.data);
//         try {
//           fixedBuffer = await convertToMp3(mp3Buffer);
//         } catch (ffmpegErr) {
//           console.log(
//             "[FFMPEG ERROR] Menggunakan file asli:",
//             ffmpegErr.message,
//           );
//           fixedBuffer = mp3Buffer;
//         }
//       } catch (fallbackErr) {
//         console.error("[PLAY DOWNLOAD FALLBACK ERROR]", fallbackErr);
//         return sendText(
//           conn,
//           m.chat,
//           config.message.error || "Terjadi kesalahan saat memproses lagu.",
//           m,
//         );
//       }
//     }

//     await reactMessage(conn, m.chat, m, "🎵");
//     await conn.sendMessage(
//       m.chat,
//       {
//         audio: fixedBuffer,
//         mimetype: "audio/mpeg",
//         fileName: `${title}.mp3`,
//         ptt: false,
//       },
//       {
//         quoted: m,
//       },
//     );
//     await reactMessage(conn, m.chat, m, "✅");
//   } catch (err) {
//     console.error("[PLAY ERROR]", err);
//     await sendText(
//       conn,
//       m.chat,
//       config.message.error || "Terjadi kesalahan saat memproses lagu.",
//       m,
//     );
//   }
// };
// handler.command = "play";
// handler.alias = ["music", "p"];
// handler.category = "Menu Tools";
// handler.submenu = "Tools";
// export default handler;
