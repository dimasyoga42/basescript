import sharp from "sharp";
import GIFEncoder from "gif-encoder-2";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const WIDTH = 512;
const HEIGHT = 512;
const PADDING = 40;
const TYPE_FRAMES = 20; // frames spent revealing the text
const HOLD_FRAMES = 14; // frames pausing on the finished text before looping
const DELAY_MS = 70; // ms per frame (applies to every frame, gif + sticker)
const BLUR = 3; // constant "brat" blur amount - typing carries the motion, not the blur
const CURSOR_BLINK_EVERY = 4; // frames per on/off toggle during the hold phase

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, fontSize, maxWidth) {
  const avgCharWidth = fontSize * 0.56; // heuristic for a narrow sans-serif
  const maxChars = Math.max(1, Math.floor(maxWidth / avgCharWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (test.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitText(text) {
  const maxWidth = WIDTH - PADDING * 2;
  const maxHeight = HEIGHT - PADDING * 2;
  let fontSize = 160;
  let lines = [text];
  while (fontSize > 20) {
    lines = wrapText(text, fontSize, maxWidth);
    const lineHeight = fontSize * 1.0;
    const blockHeight = lines.length * lineHeight;
    const widestLine = Math.max(...lines.map((l) => l.length)) * fontSize * 0.56;
    if (blockHeight <= maxHeight && widestLine <= maxWidth) break;
    fontSize -= 4;
  }
  return { fontSize, lines };
}

// Given the full wrapped lines and how many characters have been "typed" so far,
// return the partial lines plus where the blinking cursor currently sits.
function revealLines(lines, revealedCount) {
  let remaining = revealedCount;
  const result = [];
  let cursorLineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const len = lines[i].length;
    if (remaining >= len) {
      result.push(lines[i]);
      remaining -= len;
      cursorLineIndex = i;
    } else if (remaining > 0) {
      result.push(lines[i].slice(0, remaining));
      cursorLineIndex = i;
      remaining = 0;
    } else {
      result.push("");
    }
  }

  return { result, cursorLineIndex };
}

function buildSvg(layout, partialLines, cursorLineIndex, cursorVisible, blur, bg, fg) {
  const { fontSize } = layout;
  const lineHeight = fontSize * 1.0;
  const tspans = partialLines
    .map((line, i) => {
      const withCursor = i === cursorLineIndex && cursorVisible ? line + " |" : line;
      return `<tspan x="${PADDING}" dy="${i === 0 ? 0 : lineHeight}">${esc(withCursor)}</tspan>`;
    })
    .join("");

  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${blur}" />
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="${PADDING}" y="${PADDING + fontSize * 0.85}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        fill="${fg}"
        filter="url(#blur)"
        letter-spacing="-2">
    ${tspans}
  </text>
</svg>`;
}

/**
 * Render every animation frame as a raw RGBA buffer (shared by the GIF and sticker exporters).
 * @returns {Promise<{frames: Buffer[], width: number, height: number, delayMs: number}>}
 */
async function renderRawFrames(text, opts = {}) {
  const bg = opts.bg || "#ffffff";
  const fg = opts.fg || "#111111";
  const layout = fitText(text);
  const totalChars = layout.lines.reduce((sum, l) => sum + l.length, 0);
  const totalFrames = TYPE_FRAMES + HOLD_FRAMES;

  const frames = [];
  for (let f = 0; f < totalFrames; f++) {
    let revealedCount;
    let cursorVisible;

    if (f < TYPE_FRAMES) {
      revealedCount = Math.min(totalChars, Math.ceil(((f + 1) / TYPE_FRAMES) * totalChars));
      cursorVisible = true;
    } else {
      revealedCount = totalChars;
      const holdFrame = f - TYPE_FRAMES;
      cursorVisible = Math.floor(holdFrame / CURSOR_BLINK_EVERY) % 2 === 0;
    }

    const { result, cursorLineIndex } = revealLines(layout.lines, revealedCount);
    const svg = buildSvg(layout, result, cursorLineIndex, cursorVisible, BLUR, bg, fg);
    const { data } = await sharp(Buffer.from(svg))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    frames.push(data);
  }

  return { frames, width: WIDTH, height: HEIGHT, delayMs: DELAY_MS };
}

/**
 * Generate an animated "brat"-style text GIF.
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.bg="#ffffff"]
 * @param {string} [opts.fg="#111111"]
 * @returns {Promise<Buffer>} GIF file buffer
 */
export async function createBratGif(text, opts = {}) {
  const { frames, width, height, delayMs } = await renderRawFrames(text, opts);

  const encoder = new GIFEncoder(width, height, "neuquant", false);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delayMs);
  encoder.setQuality(10);
  for (const data of frames) encoder.addFrame(data);
  encoder.finish();

  return encoder.out.getData();
}

/**
 * Generate the same animation as an animated WebP, ready to send directly as a WhatsApp sticker
 * (Baileys' `sticker` message field needs webp bytes, not gif/mp4 - this handles that conversion).
 * Requires ffmpeg to be installed and available on PATH.
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.bg="#ffffff"]
 * @param {string} [opts.fg="#111111"]
 * @returns {Promise<Buffer>} animated .webp file buffer
 */
export async function createBratSticker(text, opts = {}) {
  const { frames, width, height, delayMs } = await renderRawFrames(text, opts);
  const raw = Buffer.concat(frames);
  const fps = Math.max(1, Math.round(1000 / delayMs));

  const tmpOut = path.join(os.tmpdir(), `brat-${crypto.randomUUID()}.webp`);

  await new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-f", "rawvideo",
      "-pixel_format", "rgba",
      "-video_size", `${width}x${height}`,
      "-framerate", String(fps),
      "-i", "pipe:0",
      "-vcodec", "libwebp",
      "-lossless", "0",
      "-qscale", "75",
      "-preset", "default",
      "-loop", "0",
      "-an",
      "-fps_mode", "passthrough",
      "-y", tmpOut,
    ]);

    let stderr = "";
    ff.stderr.on("data", (d) => (stderr += d));
    ff.on("error", reject); // e.g. ffmpeg not installed / not on PATH
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`))));

    ff.stdin.on("error", () => { }); // avoid unhandled EPIPE if ffmpeg exits early on bad input
    ff.stdin.write(raw);
    ff.stdin.end();
  });

  try {
    return await fs.readFile(tmpOut);
  } finally {
    fs.unlink(tmpOut).catch(() => { });
  }
}
