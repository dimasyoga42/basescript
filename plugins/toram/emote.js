// import { config, thumbnail } from "../../config.js";
// import { sendFancyText } from "../../src/config/message.js";
// import { supa } from "../../src/config/supa.js";
// import axios from "axios";

// const handler = async (m, { conn }) => {
//   try {
//     const name = m.text.replace(".emot", "").trim();

//     if (!name) {
//       return sendFancyText(conn, m.chat, {
//         title: config.BotName,
//         body: "example: .emot dance",
//         thumbnail,
//         text: config.message.invalid,
//         quoted: m,
//       });
//     }

//     const { data } = await supa
//       .from("emot")
//       .select("name, url")
//       .ilike("name", `%${name}%`)
//       .limit(1)
//       .maybeSingle();

//     if (!data) {
//       return sendFancyText(conn, m.chat, {
//         title: config.BotName,
//         body: `Developer By ${config.OwnerName}`,
//         thumbnail,
//         text: config.message.notFound ?? "Data tidak ditemukan.",
//         quoted: m,
//       });
//     }

//     // ─── FETCH IMAGE/GIF ───────────────────────────────
//     let res;

//     try {
//       res = await axios.get(data.url, {
//         responseType: "arraybuffer",
//         timeout: 20000,
//         headers: {
//           "User-Agent": "Mozilla/5.0",
//           Accept: "image/*,*/*",
//         },
//         validateStatus: () => true,
//       });

//       if (res.status !== 200) throw new Error("Bad status");
//     } catch {
//       // 🔥 fallback (kalau github raw error)
//       const fallback = data.url.replace(
//         "raw.githubusercontent.com",
//         "cdn.jsdelivr.net/gh",
//       );

//       res = await axios.get(fallback, {
//         responseType: "arraybuffer",
//         timeout: 20000,
//         headers: {
//           "User-Agent": "Mozilla/5.0",
//         },
//       });
//     }

//     const buffer = Buffer.from(res.data);
//     const contentType = res.headers["content-type"] || "";

//     // ─── DETECT GIF ───────────────────────────────────
//     const isGif =
//       contentType.includes("gif") || data.url.toLowerCase().includes(".gif");

//     // ─── SEND ─────────────────────────────────────────
//     if (isGif) {
//       await conn.sendMessage(
//         m.chat,
//         {
//           video: buffer,
//           mimetype: "image/gif",
//           gifPlayback: true,
//           caption: data.name,
//         },
//         { quoted: m },
//       );
//     } else {
//       await conn.sendMessage(
//         m.chat,
//         {
//           image: buffer,
//           caption: data.name,
//         },
//         { quoted: m },
//       );
//     }
//   } catch (err) {
//     console.error("emot error:", err.message);

//     sendFancyText(conn, m.chat, {
//       title: config.BotName,
//       body: `Developer By ${config.OwnerName}`,
//       thumbnail,
//       text: config.message.error,
//       quoted: m,
//     });
//   }
// };

// handler.command = ["emot"];
// handler.category = "Toram Search";
// handler.submenu = "Toram";

// export default handler;
