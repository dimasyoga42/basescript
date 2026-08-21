import { downloadMediaMessage } from "@whiskeysockets/baileys";
import sharp from "sharp";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { getUserData } from "../../src/config/func.js";
import path from "path";

const db = path.resolve("db", "packname.json");

const getMediaMessage = (m) => {
  if (m.message?.imageMessage || m.message?.videoMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted };
  }
  return null;
};

const parseText = (text = "") => {
  const input = text.replace(/\.(stiker|s|smeme)/i, "").trim();
  const [top = "", bottom = ""] = input.split("|");
  return {
    top: top.trim(),
    bottom: bottom.trim(),
  };
};

const getStickerWM = (chatId) => {
  const data = getUserData(db);
  if (!Array.isArray(data)) {
    return {
      packname: config.BotName,
      author: config.OwnerName,
    };
  }
  const dataPack = data.find((item) => item.id === chatId);
  return {
    packname: dataPack?.pack || config.BotName,
    author: dataPack?.author || config.OwnerName,
  };
};

const escapeXml = (text = "") =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const estimateCharWidth = (fontSize) => fontSize * 0.6;

const wrapTextToLines = (text, maxWidth, fontSize) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const charWidth = estimateCharWidth(fontSize);
  const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));

  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      if (word.length > maxCharsPerLine) {
        let remaining = word;
        while (remaining.length > maxCharsPerLine) {
          lines.push(remaining.slice(0, maxCharsPerLine));
          remaining = remaining.slice(maxCharsPerLine);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const fitTextToBox = (text, boxWidth, boxHeight, maxFontSize, minFontSize) => {
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    const lines = wrapTextToLines(text, boxWidth, fontSize);
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= boxHeight) {
      return { lines, fontSize, lineHeight };
    }

    fontSize -= 2;
  }

  const lines = wrapTextToLines(text, boxWidth, minFontSize);
  return { lines, fontSize: minFontSize, lineHeight: minFontSize * 1.2 };
};

const buildTextGroup = (lines, fontSize, lineHeight, centerX, anchorY, direction) => {
  if (lines.length === 0) return "";

  const strokeWidth = Math.max(2, Math.round(fontSize / 12));

  return lines
    .map((line, index) => {
      const y =
        direction === "down"
          ? anchorY + index * lineHeight
          : anchorY - (lines.length - 1 - index) * lineHeight;

      return `<text x="${centerX}" y="${y}" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="#ffffff" stroke="#000000" stroke-width="${strokeWidth}" paint-order="stroke" text-anchor="middle">${escapeXml(line)}</text>`;
    })
    .join("");
};

const composeMemeImage = async (buffer, topText, bottomText) => {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width || 512;
  const height = metadata.height || 512;

  const horizontalPadding = width * 0.06;
  const boxWidth = width - horizontalPadding * 2;
  const verticalPadding = height * 0.04;
  const maxBoxHeight = height * 0.28;

  const maxFontSize = Math.round(width / 10);
  const minFontSize = Math.max(12, Math.round(width / 28));

  const centerX = width / 2;

  let svgContent = "";

  if (topText) {
    const { lines, fontSize, lineHeight } = fitTextToBox(
      topText,
      boxWidth,
      maxBoxHeight,
      maxFontSize,
      minFontSize,
    );
    const anchorY = verticalPadding + fontSize;
    svgContent += buildTextGroup(lines, fontSize, lineHeight, centerX, anchorY, "down");
  }

  if (bottomText) {
    const { lines, fontSize, lineHeight } = fitTextToBox(
      bottomText,
      boxWidth,
      maxBoxHeight,
      maxFontSize,
      minFontSize,
    );
    const anchorY = height - verticalPadding;
    svgContent += buildTextGroup(lines, fontSize, lineHeight, centerX, anchorY, "up");
  }

  const svgOverlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;

  return image
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();
};

const buildSticker = async (buffer, packname, author) => {
  const sticker = new Sticker(buffer, {
    pack: packname,
    author: author,
    type: StickerTypes.FULL,
    categories: ["🤩", "🎉"],
    quality: 70,
  });
  return sticker.toBuffer();
};

const handler = async (m, { conn }) => {
  try {
    const mediaMsg = getMediaMessage(m);
    if (!mediaMsg) {
      return sendText(conn, m.chat, "Reply gambar/video dengan .stiker\nContoh: .stiker Halo | Dunia", m);
    }

    const { packname, author } = getStickerWM(m.chat);

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      {
        reuploadRequest: conn.updateMediaMessage,
      },
    );

    if (!buffer || buffer.length === 0) {
      throw new Error("Gagal mengunduh media, buffer kosong");
    }

    if (mediaMsg.message?.videoMessage) {
      const stickerBuffer = await buildSticker(buffer, packname, author);
      return conn.sendMessage(
        m.chat,
        { sticker: stickerBuffer },
        { quoted: m },
      );
    }

    const { top, bottom } = parseText(m.text);

    const finalBuffer =
      top || bottom
        ? await composeMemeImage(buffer, top, bottom)
        : buffer;

    const stickerBuffer = await buildSticker(finalBuffer, packname, author);

    return conn.sendMessage(
      m.chat,
      { sticker: stickerBuffer },
      { quoted: m },
    );
  } catch (err) {
    console.error("[stiker]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = "stiker";
handler.alias = ["s", "smeme"];
handler.category = "Menu Tools";
handler.submenu = "Media";

export default handler;
