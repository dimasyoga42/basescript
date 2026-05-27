// avatarGrid.js — dipanggil dari handler bot
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fetch from "node-fetch";

const IMG_W = 600;
const IMG_H = 300;
const PADDING = 20;
const LABEL_H = 50;
const BG_COLOR = "#1a1a2e";
const FONT_SIZE = 16;

export async function buildAvaGrid(apiUrl) {
  const res = await fetch(apiUrl);
  const json = await res.json();
  const items = json.result.data;

  const canvasW = IMG_W + PADDING * 2;
  const canvasH =
    items.length * (IMG_H + LABEL_H) + (items.length + 1) * PADDING;

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const x = PADDING;
    const y = PADDING + i * (IMG_H + LABEL_H + PADDING);

    // Gambar avatar
    try {
      const img = await loadImage(item.image);
      ctx.drawImage(img, x, y, IMG_W, IMG_H);
    } catch {
      ctx.fillStyle = "#2a2a4e";
      ctx.fillRect(x, y, IMG_W, IMG_H);
    }

    // Label background
    ctx.fillStyle = "#0f0f1e";
    ctx.fillRect(x, y + IMG_H, IMG_W, LABEL_H);

    // Tanggal
    const date = item.date.replace(/［|］/g, "").trim();
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(date, x + IMG_W - 8, y + IMG_H + 18);

    // Nama (potong jika terlalu panjang)
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${FONT_SIZE}px sans-serif`;
    ctx.textAlign = "left";
    let name = item.name;
    while (ctx.measureText(name).width > IMG_W - 16) name = name.slice(0, -1);
    if (name !== item.name) name += "...";
    ctx.fillText(name, x + 8, y + IMG_H + 36);
  }

  return canvas.toBuffer("image/png"); // return Buffer, siap dikirim ke WA
}
