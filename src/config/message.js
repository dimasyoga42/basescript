import fs from "fs";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { config } from "../../config.js";

const ensure = (v, name) => {
  if (!v) throw new Error(`${name} is required`);
};

// Satu-satunya tempat yang bikin contextInfo (isForwarded + externalAdReply).
// Semua fungsi "fancy" (sendFancyText, sendMenu, sendBtns, sendFancyTextModif)
// tinggal panggil ini, gak perlu bikin object externalAdReply sendiri-sendiri lagi.
//
// FIXED:
// 1. "fisForwarded" -> "isForwarded" (typo)
// 2. "Math.random() * config.thumbnail" -> "Math.random() * config.thumbnail.length"
//    (sebelumnya array dikaliin number langsung -> NaN -> index jadi undefined
//    -> thumbnailUrl selalu undefined -> context/card gak pernah muncul)
// 3. Semua opsi sekarang bisa di-override per pemanggilan, fallback ke config kalau kosong.
const messagetxt = ({
  title,
  body,
  thumbnailUrl,
  sourceUrl,
  mediaType = 1, // 1 = image
  previewType = "PHOTO",
  renderLargerThumbnail = true,
  showAdAttribution = true,
} = {}) => {
  return {
    isForwarded: true,
    forwardingScore: 999,
    externalAdReply: {
      title: title || config.BotName,
      body:
        body || config.msgtxt[Math.floor(Math.random() * config.msgtxt.length)],
      thumbnailUrl:
        thumbnailUrl ||
        config.thumbnail[Math.floor(Math.random() * config.thumbnail.length)],
      mediaType,
      previewType,
      renderLargerThumbnail,
      showAdAttribution,
      sourceUrl: sourceUrl || "https://neurasama.my.id",
      containsAutoReply: true,
    },
  };
};

export const sendText = async (sock, jid, text, quoted = null) => {
  ensure(jid, "jid");
  ensure(text, "text");

  await sock.sendMessage(jid, { text }, { quoted });
};

export const editText = async (sock, jid, message, text) => {
  ensure(jid, "jid");
  ensure(text, "text");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 1000));

  await sock.sendMessage(jid, {
    text,
    edit: message.key,
  });

  return await sock.sendPresenceUpdate("paused", jid);
};

export const reactMessage = async (sock, jid, message, emoji) => {
  ensure(jid, "jid");
  ensure(emoji, "emoji");

  return await sock.sendMessage(jid, {
    react: {
      text: emoji,
      key: message.key,
    },
  });
};

export const sendImage = async (
  sock,
  jid,
  image,
  caption = "",
  quoted = null,
) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      image: Buffer.isBuffer(image) ? image : { url: image },
      caption,
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendVideo = async (
  sock,
  jid,
  video,
  caption = "",
  quoted = null,
) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      video: Buffer.isBuffer(video) ? video : { url: video },
      caption,
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendAudio = async (
  sock,
  jid,
  audio,
  ptt = false,
  quoted = null,
) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      audio: Buffer.isBuffer(audio) ? audio : { url: audio },
      ptt,
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendSticker = async (sock, jid, sticker, quoted = null) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 200));

  await sock.sendMessage(
    jid,
    {
      sticker: Buffer.isBuffer(sticker) ? sticker : { url: sticker },
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendDocument = async (
  sock,
  jid,
  file,
  filename = "file",
  mimetype = "",
  quoted = null,
) => {
  ensure(jid, "jid");

  return await sock.sendMessage(
    jid,
    {
      document: Buffer.isBuffer(file) ? file : { url: file },
      fileName: filename,
      mimetype,
    },
    { quoted },
  );
};

export const sendButton = async (
  sock,
  jid,
  text,
  footer,
  buttons = [],
  quoted = null,
) => {
  ensure(jid, "jid");

  return await sock.sendButton(
    jid,
    {
      text,
      footer,
      buttons,
      headerType: 1,
    },
    { quoted },
  );
};

export const sendList = async (
  sock,
  jid,
  text,
  footer,
  title,
  buttonText,
  sections = [],
  quoted = null,
) => {
  ensure(jid, "jid");

  return await sock.sendMessage(
    jid,
    {
      text,
      footer,
      title,
      buttonText,
      sections,
    },
    { quoted },
  );
};

export const sendFancyText = async (
  sock,
  jid,
  {
    title,
    body,
    text = "",
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      text,
      contextInfo: messagetxt({
        title,
        body,
        thumbnailUrl: thumbnail,
        renderLargerThumbnail,
        sourceUrl: "https://whatsapp.com",
      }),
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

// FIXED: variabel "externalAdReply" lokal yang lama tidak pernah dipakai (dead code) -> dihapus.
// Konteks yang benar-benar dikirim adalah hasil dari messagetxt(name).
export const sendFancyTextModif = async (
  sock,
  jid,
  { name = "neura", image = "", caption = "", quoted = null } = {},
) => {
  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      image: { url: image },
      caption: caption,
      contextInfo: messagetxt({ title: name }),
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendMenu = async (
  sock,
  jid,
  {
    title,
    body,
    text = "",
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      text,
      contextInfo: messagetxt({
        title,
        body,
        thumbnail: thumbnail,
        renderLargerThumbnail,
        showAdAttribution: false,
        sourceUrl: "https://whatsapp.com",
      }),
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const downloadMedia = async (message, type = "buffer") => {
  const stream = await downloadContentFromMessage(
    message,
    message.mimetype.split("/")[0],
  );

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  if (type === "buffer") {
    return buffer;
  }

  return fs.writeFileSync("./downloaded_media", buffer);
};

export const sendbtn = () => {};

export const buildSelectButton = (title, sectionTitle, rows) => ({
  name: "single_select",
  buttonParamsJson: JSON.stringify({
    title,
    sections: [
      {
        title: sectionTitle,
        rows,
      },
    ],
  }),
});

export const sendBtns = async (
  sock,
  jid,
  {
    title,
    body,
    text = "",
    footer = "Dimasyoga",
    buttons = [],
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendButton(
    jid,
    {
      text,
      footer,
      buttons,
      headerType: 1,
      contextInfo: messagetxt({
        title,
        body,
        thumbnailUrl: thumbnail,
        renderLargerThumbnail,
        sourceUrl: "https://whatsapp.com",
      }),
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};
