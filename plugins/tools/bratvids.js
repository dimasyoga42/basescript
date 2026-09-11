// import { config, thumbnail } from "../../config.js";
// import { sendFancyText, sendText } from "../../src/config/message.js";
// import { createBratSticker } from "../../src/lib/bratvid.js";

// const getText = (m) => {
//   // teks setelah command, mis: ".brat capek banget hari ini"
//   const body = m.text || m.message?.conversation || m.message?.extendedTextMessage?.text || "";
//   const args = body.trim().split(/\s+/).slice(1).join(" ");
//   if (args) return args;

//   // fallback: teks dari pesan yang di-reply
//   const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
//   const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text;
//   if (quotedText) return quotedText;

//   return null;
// };

// const handler = async (m, { conn }) => {
//   const text = getText(m);

//   if (!text) {
//     return sendText(conn, m.chat, "gunakan .brat <text>", m);
//   }

//   try {
//     const stickerBuffer = await createBratSticker(text);

//     await conn.sendMessage(
//       m.chat,
//       {
//         sticker: stickerBuffer,
//       },
//       { quoted: m },
//     );
//   } catch (err) {
//     console.error(err);
//     sendFancyText(conn, m.chat, {
//       title: config.BotName,
//       body: `develop by ${config.OwnerName}`,
//       thumbnail: thumbnail,
//       text: config.message.error,
//       quoted: m,
//     });
//   }
// };

// handler.command = "brat";
// handler.category = "Menu Tools";
// handler.submenu = "Tools";

// export default handler;
