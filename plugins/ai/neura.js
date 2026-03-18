import { NeuraBot } from "./groq.js";

export const messageHandler = async (sock, chatId, msg) => {
  const messageType = Object.keys(msg.message || {})[0];
  const isGroup = chatId.endsWith("@g.us");
  const fromMe = msg.key.fromMe;

  if (fromMe) return; // abaikan pesan dari bot sendiri

  let text = "";
  if (messageType === "conversation") {
    text = msg.message.conversation;
  } else if (messageType === "extendedTextMessage") {
    text = msg.message.extendedTextMessage.text;
  }

  // Normalisasi pesan
  const lowerText = text?.toLowerCase().trim() || "";
  const botName = "neura";

  // Cek apakah pesan adalah replay ke bot
  const isReplyToBot =
    messageType === "extendedTextMessage" &&
    msg.message.extendedTextMessage.contextInfo?.participant === sock.user.id;

  // Cek apakah nama bot disebut di awal/akhir
  const isMentioned =
    lowerText.startsWith(botName) || lowerText.endsWith(botName);

  if (isMentioned || isReplyToBot) {
    // Panggil fungsi bot Karina
    await NeuraBot(sock, chatId, msg, text);
  }
};
