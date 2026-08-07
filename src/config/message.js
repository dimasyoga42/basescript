import fs from "fs";
import { randomUUID } from "crypto";
import fetch from "node-fetch";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { config } from "../../config.js";

const ensure = (v, name) => {
  if (!v) throw new Error(`${name} is required`);
};

const pickRandom = (arr, fallback = "") => {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
};

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "application/pdf": "pdf",
};

const getExtensionFromMime = (mimetype) =>
  MIME_EXTENSION_MAP[mimetype] || "bin";

const thumbnailBufferCache = new Map();

const fetchThumbnailBuffer = async (url) => {
  if (!url) return null;
  if (thumbnailBufferCache.has(url)) {
    return thumbnailBufferCache.get(url);
  }

  try {
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    thumbnailBufferCache.set(url, buffer);
    return buffer;
  } catch (error) {
    console.error(`Gagal mengunduh thumbnail dari ${url}: ${error.message}`);
    return null;
  }
};

// Membuat link preview standar WhatsApp (bukan externalAdReply/iklan).
// Ini fitur normal yang dipakai semua user tiap kirim URL, jadi tidak
// divalidasi khusus oleh server dan reliable sampai ke penerima.
const buildLinkPreview = async ({
  title,
  description,
  sourceUrl,
  thumbnailUrl,
} = {}) => {
  const resolvedUrl = sourceUrl || "https://neurasama.my.id";
  const resolvedThumbnailUrl = thumbnailUrl || pickRandom(config.thumbnail);
  const jpegThumbnail = await fetchThumbnailBuffer(resolvedThumbnailUrl);

  return {
    "canonical-url": resolvedUrl,
    "matched-text": resolvedUrl,
    title: title || config.BotName,
    description: description || pickRandom(config.msgtxt),
    jpegThumbnail: jpegThumbnail || undefined,
  };
};

export const sendText = async (sock, jid, text, quoted = null) => {
  ensure(jid, "jid");
  ensure(text, "text");

  try {
    return await sock.sendMessage(jid, { text }, { quoted });
  } catch (error) {
    throw new Error(`Gagal mengirim teks: ${error.message}`);
  }
};

export const editText = async (sock, jid, message, text) => {
  ensure(jid, "jid");
  ensure(message?.key, "message.key");
  ensure(text, "text");

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise((r) => setTimeout(r, 1000));

    await sock.sendMessage(jid, {
      text,
      edit: message.key,
    });

    return await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    throw new Error(`Gagal mengedit pesan: ${error.message}`);
  }
};

export const reactMessage = async (sock, jid, message, emoji) => {
  ensure(jid, "jid");
  ensure(message?.key, "message.key");
  ensure(emoji, "emoji");

  try {
    return await sock.sendMessage(jid, {
      react: {
        text: emoji,
        key: message.key,
      },
    });
  } catch (error) {
    throw new Error(`Gagal mengirim reaksi: ${error.message}`);
  }
};

export const sendImage = async (
  sock,
  jid,
  image,
  caption = "",
  quoted = null,
) => {
  ensure(jid, "jid");
  ensure(image, "image");

  try {
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
  } catch (error) {
    throw new Error(`Gagal mengirim gambar: ${error.message}`);
  }
};

export const sendVideo = async (
  sock,
  jid,
  video,
  caption = "",
  quoted = null,
) => {
  ensure(jid, "jid");
  ensure(video, "video");

  try {
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
  } catch (error) {
    throw new Error(`Gagal mengirim video: ${error.message}`);
  }
};

export const sendAudio = async (
  sock,
  jid,
  audio,
  ptt = false,
  quoted = null,
) => {
  ensure(jid, "jid");
  ensure(audio, "audio");

  try {
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
  } catch (error) {
    throw new Error(`Gagal mengirim audio: ${error.message}`);
  }
};

export const sendSticker = async (sock, jid, sticker, quoted = null) => {
  ensure(jid, "jid");
  ensure(sticker, "sticker");

  try {
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
  } catch (error) {
    throw new Error(`Gagal mengirim stiker: ${error.message}`);
  }
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
  ensure(file, "file");

  try {
    return await sock.sendMessage(
      jid,
      {
        document: Buffer.isBuffer(file) ? file : { url: file },
        fileName: filename,
        mimetype,
      },
      { quoted },
    );
  } catch (error) {
    throw new Error(`Gagal mengirim dokumen: ${error.message}`);
  }
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
  ensure(text, "text");
  ensure(Array.isArray(buttons) && buttons.length > 0, "buttons");

  try {
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
  } catch (error) {
    throw new Error(`Gagal mengirim button: ${error.message}`);
  }
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
  ensure(text, "text");
  ensure(Array.isArray(sections) && sections.length > 0, "sections");

  try {
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
  } catch (error) {
    throw new Error(`Gagal mengirim list: ${error.message}`);
  }
};

export const sendFancyText = async (
  sock,
  jid,
  {
    title,
    body,
    text = "",
    thumbnail = null,
    quoted = null,
  } = {},
) => {
  ensure(jid, "jid");

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise((r) => setTimeout(r, 100));

    const linkPreview = await buildLinkPreview({
      title,
      description: body,
      thumbnailUrl: thumbnail,
    });

    await sock.sendMessage(
      jid,
      {
        text: text || linkPreview["canonical-url"],
        linkPreview,
      },
      { quoted },
    );

    return await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    throw new Error(`Gagal mengirim fancy text: ${error.message}`);
  }
};

export const sendFancyTextModif = async (
  sock,
  jid,
  { name = "neura", image = "", caption = "", quoted = null } = {},
) => {
  ensure(jid, "jid");
  ensure(image, "image");

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise((r) => setTimeout(r, 100));

    await sock.sendMessage(
      jid,
      {
        image: { url: image },
        caption: caption,
      },
      { quoted },
    );

    return await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    throw new Error(`Gagal mengirim fancy text modif: ${error.message}`);
  }
};

export const sendMenu = async (
  sock,
  jid,
  {
    title,
    body,
    text = "",
    thumbnail = null,
    quoted = null,
  } = {},
) => {
  ensure(jid, "jid");

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise((r) => setTimeout(r, 100));

    const linkPreview = await buildLinkPreview({
      title,
      description: body,
      thumbnailUrl: thumbnail,
    });

    await sock.sendMessage(
      jid,
      {
        text: text || linkPreview["canonical-url"],
        linkPreview,
      },
      { quoted },
    );

    return await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    throw new Error(`Gagal mengirim menu: ${error.message}`);
  }
};

export const downloadMedia = async (message, type = "buffer") => {
  ensure(message, "message");
  ensure(message?.mimetype, "message.mimetype");

  try {
    const mediaCategory = message.mimetype.split("/")[0];
    const stream = await downloadContentFromMessage(message, mediaCategory);

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (type === "buffer") {
      return buffer;
    }

    const extension = getExtensionFromMime(message.mimetype);
    const filePath = `./downloads/${randomUUID()}.${extension}`;

    await fs.promises.mkdir("./downloads", { recursive: true });
    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new Error(`Gagal mengunduh media: ${error.message}`);
  }
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
    quoted = null,
  } = {},
) => {
  ensure(jid, "jid");
  ensure(Array.isArray(buttons) && buttons.length > 0, "buttons");

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise((r) => setTimeout(r, 100));

    const linkPreview = await buildLinkPreview({
      title,
      description: body,
      thumbnailUrl: thumbnail,
    });

    await sock.sendButton(
      jid,
      {
        text: text || linkPreview["canonical-url"],
        footer,
        buttons,
        headerType: 1,
        linkPreview,
      },
      { quoted },
    );

    return await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    throw new Error(`Gagal mengirim button dengan preview: ${error.message}`);
  }
};
