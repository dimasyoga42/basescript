// import { config } from "../../config.js";
// import { supa } from "../../src/config/supa.js";

// const normalizeName = (str) =>
//   (str || "").toLowerCase().replace(/\s+/g, " ").trim();

// const parseRoute = (route) => {
//   if (!route || typeof route !== "string") return [];
//   return route
//     .split(/\s*->\s*/)
//     .map((r) => r.trim())
//     .filter((r) => r.length > 0);
// };

// const mergeRoutes = (normalRoutes, maxRoutes) => {
//   const seen = new Set();
//   const result = [];

//   for (const r of maxRoutes) {
//     const key = normalizeName(r);
//     if (!seen.has(key)) {
//       seen.add(key);
//       result.push(r);
//     }
//   }

//   for (const r of normalRoutes) {
//     const key = normalizeName(r);
//     if (!seen.has(key)) {
//       seen.add(key);
//       result.push(r);
//     }
//   }

//   return result;
// };

// const sendXtalResult = (conn, chat, m, item) => {
//   const normalPath = parseRoute(item.upgrade_route);
//   const maxPath = parseRoute(item.max_upgrade_route);
//   const combinedRoutes = mergeRoutes(normalPath, maxPath);

//   const text = `*${item.name}* [${item.type || "-"}]

// *Stats:*
// ${item.stats || "-"}

// === RAW ===
// Normal:
// ${item.upgrade_route || "-"}

// Max:
// ${item.max_upgrade_route || "-"}

// === PARSED ===
// Normal:
// ${normalPath.join("\n") || "-"}

// Max:
// ${maxPath.join("\n") || "-"}

// === MERGED RESULT ===
// ${combinedRoutes.join("\n") || "-"}
// `.trim();

//   return conn.sendMessage(chat, { text }, { quoted: m });
// };

// const handler = async (m, { conn }) => {
//   try {
//     const query = (m.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

//     if (!query) {
//       return conn.sendMessage(
//         m.chat,
//         { text: "Format salah. Gunakan: .xtal [nama xtal]" },
//         { quoted: m },
//       );
//     }

//     // --all tetap sama
//     if (query === "--all") {
//       const { data: db, error } = await supa
//         .from("xtal")
//         .select("name")
//         .order("name", { ascending: true });

//       if (error || !db?.length) {
//         return conn.sendMessage(
//           m.chat,
//           { text: "Gagal mengambil data dari database." },
//           { quoted: m },
//         );
//       }

//       return conn.sendButton(m.chat, {
//         text: "Daftar Seluruh Crysta:",
//         footer: config.OwnerName,
//         buttons: db.slice(0, 20).map((item) => ({
//           name: "quick_reply",
//           buttonParamsJson: JSON.stringify({
//             display_text: item.name,
//             id: `.xtal ${item.name}`,
//           }),
//         })),
//         bottom_sheet: true,
//         bottom_name: "Daftar Xtall",
//       });
//     }

//     // exact match
//     const { data: exact, error: errExact } = await supa
//       .from("xtal")
//       .select("name, type, upgrade_route, stats, max_upgrade_route")
//       .ilike("name", query)
//       .limit(1);

//     if (!errExact && exact?.length === 1) {
//       return sendXtalResult(conn, m.chat, m, exact[0]);
//     }

//     // partial match
//     const { data, error } = await supa
//       .from("xtal")
//       .select("name, type, upgrade_route, stats, max_upgrade_route")
//       .ilike("name", `%${query}%`)
//       .limit(20);

//     if (error || !data?.length) {
//       return conn.sendMessage(
//         m.chat,
//         { text: `Informasi untuk *${query}* tidak ditemukan dalam database.` },
//         { quoted: m },
//       );
//     }

//     if (data.length === 1) {
//       return sendXtalResult(conn, m.chat, m, data[0]);
//     }

//     return conn.sendButton(m.chat, {
//       text: `Ditemukan *${data.length}* hasil yang relevan untuk: _${query}_`,
//       footer: config.OwnerName,
//       buttons: data.map((item) => ({
//         name: "quick_reply",
//         buttonParamsJson: JSON.stringify({
//           display_text: item.name,
//           id: `.xtal ${item.name}`,
//         }),
//       })),
//       bottom_sheet: true,
//       bottom_name: "Hasil Pencarian",
//     });
//   } catch (err) {
//     console.error("Internal Server Error (Xtal Handler):", err);
//     return conn.sendMessage(
//       m.chat,
//       { text: "Terjadi kegagalan sistem saat memproses permintaan." },
//       { quoted: m },
//     );
//   }
// };

// handler.command = "xtall";
// handler.alias = ["xtal"];
// handler.category = "Toram Search";

// export default handler;
