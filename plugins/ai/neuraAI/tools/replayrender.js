
export const replyReader = async (ctx) => {
  const msg = ctx?.msg;
  const sock = ctx?.sock;

  if (!msg || !sock) {
    return "Tidak ada pesan yang di-reply.";
  }

  const contextInfo =
    msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo ||
    msg?.message?.documentMessage?.contextInfo ||
    null;

  const quotedMessage = contextInfo?.quotedMessage;
  if (!quotedMessage) {
    return "Tidak ada pesan yang di-reply.";
  }

  const normalizeJid = (jid) =>
    typeof jid === "string" ? jid.split(":")[0].split("@")[0] : "";

  const quotedSenderJid = contextInfo?.participant || "";
  const botJid = sock?.user?.id || "";
  const isFromBot =
    !!quotedSenderJid &&
    !!botJid &&
    normalizeJid(quotedSenderJid) === normalizeJid(botJid);

  if (isFromBot) {
    return "Pesan yang di-reply adalah pesan Neura sendiri, tidak ada info baru.";
  }

  const extractText = (message) => {
    if (!message || typeof message !== "object") return "";
    if (typeof message.conversation === "string") return message.conversation;
    if (typeof message.extendedTextMessage?.text === "string") return message.extendedTextMessage.text;
    if (typeof message.imageMessage?.caption === "string") return message.imageMessage.caption || "[gambar]";
    if (typeof message.videoMessage?.caption === "string") return message.videoMessage.caption || "[video]";
    if (typeof message.documentMessage?.caption === "string") return message.documentMessage.caption || "[dokumen]";
    if (message.audioMessage) return "[pesan suara]";
    if (message.stickerMessage) return "[stiker]";
    if (message.imageMessage) return "[gambar]";
    if (message.videoMessage) return "[video]";
    if (message.documentMessage) return "[dokumen]";
    if (message.ephemeralMessage?.message) return extractText(message.ephemeralMessage.message);
    if (message.viewOnceMessage?.message) return extractText(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2?.message) return extractText(message.viewOnceMessageV2.message);
    return "";
  };

  const text = extractText(quotedMessage).trim();

  if (!text) {
    return "Pesan yang di-reply tidak mengandung teks yang bisa dibaca.";
  }

  return `Isi pesan yang di-reply: "${text.slice(0, 500)}"`;
};
