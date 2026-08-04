import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import path from "path";

async function urlToThumbnailBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: new URL(url).origin,
      },
      timeout: 15000,
    });

    const buffer = Buffer.from(res.data);

    const contentType = res.headers["content-type"] || "";
    if (!contentType.startsWith("image/")) {
      console.error(
        "[urlToThumbnailBuffer] URL tidak mengembalikan gambar, content-type:",
        contentType
      );
      return null;
    }

    if (buffer.length < 100) {
      console.error("[urlToThumbnailBuffer] Buffer terlalu kecil");
      return null;
    }

    return await sharp(buffer)
      .resize(300, 300, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("[urlToThumbnailBuffer] Gagal proses thumbnail:", err.message);
    return null;
  }
}

async function bufferToThumbnailBuffer(buffer) {
  try {
    return await sharp(buffer)
      .resize(300, 300, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("[bufferToThumbnailBuffer] Gagal proses buffer:", err.message);
    return null;
  }
}

async function localFileToThumbnailBuffer(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error("[localFileToThumbnailBuffer] File tidak ditemukan:", absolutePath);
      return null;
    }
    return await bufferToThumbnailBuffer(fs.readFileSync(absolutePath));
  } catch (err) {
    console.error("[localFileToThumbnailBuffer] Error:", err.message);
    return null;
  }
}

/**
 * Kirim pesan teks dengan contextInfo custom (quoted, mention, forwarded, channel, externalAdReply).
 * Mengikuti pola relayMessage + extendedTextMessage langsung (bukan generateWAMessage),
 * karena field "thumbnail" (bukan "jpegThumbnail") yang dikenali fork Baileys ini.
 */
export const sendTextWithContext = async (conn, chatId, text, options = {}) => {
  const {
    quoted = null,
    mentions = [],
    forwarded = false,
    forwardingScore = 0,
    externalAdReply = null,
    channel = null,
  } = options;

  const contextInfo = {};

  if (mentions.length) {
    contextInfo.mentionedJid = mentions;
  }

  if (forwarded) {
    contextInfo.isForwarded = true;
    contextInfo.forwardingScore = forwardingScore || 1;
  }

  if (externalAdReply) {
    let thumbnail = null;

    if (externalAdReply.thumbnail && Buffer.isBuffer(externalAdReply.thumbnail)) {
      thumbnail = await bufferToThumbnailBuffer(externalAdReply.thumbnail);
    } else if (externalAdReply.thumbnailPath) {
      thumbnail = await localFileToThumbnailBuffer(externalAdReply.thumbnailPath);
    } else if (externalAdReply.thumbnailUrl) {
      thumbnail = await urlToThumbnailBuffer(externalAdReply.thumbnailUrl);
    }

    console.log(
      "[sendTextWithContext] thumbnail buffer:",
      thumbnail ? `${thumbnail.length} bytes` : "NULL/GAGAL"
    );

    contextInfo.externalAdReply = {
      title: externalAdReply.title || "",
      body: externalAdReply.body || "",
      mediaType: externalAdReply.mediaType || 1,
      previewType: externalAdReply.previewType ?? 0,
      renderLargerThumbnail: externalAdReply.renderLargerThumbnail ?? false,
      sourceUrl: externalAdReply.sourceUrl || "",
      ...(thumbnail ? { thumbnail } : {}),
      ...(externalAdReply.thumbnailUrl ? { thumbnailUrl: externalAdReply.thumbnailUrl } : {}),
    };

    const hasLink = /https?:\/\//.test(text);
    if (!hasLink && externalAdReply.sourceUrl) {
      text = `${text}\n${externalAdReply.sourceUrl}`;
    }
  }

  if (channel?.id) {
    contextInfo.forwardingScore = contextInfo.forwardingScore || 999;
    contextInfo.isForwarded = true;
    contextInfo.forwardedNewsletterMessageInfo = {
      newsletterJid: channel.id,
      newsletterName: channel.name || "Channel",
      serverMessageId: channel.serverMessageId || 1,
    };
  }

  // --- Kirim langsung pakai relayMessage + extendedTextMessage, sesuai pola yang terbukti jalan ---
  return conn.relayMessage(
    chatId,
    {
      extendedTextMessage: {
        text,
        contextInfo,
      },
    },
    { quoted}
  );
};

export const sendText = async (conn, chatId, text, quoted = null) => {
  return conn.sendMessage(chatId, { text }, quoted ? { quoted } : {});
};
