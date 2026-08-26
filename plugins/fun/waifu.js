import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const API_URL = "https://api.nekosapi.com/v4/images/random";

const BLOCKED_TAG_PATTERN =
  /(nude|naked|nipple|breast|panty|panties|underwear|ecchi|hentai|pussy|sex|cum|topless|lingerie)/i;

const COOLDOWN_MS = 15_000;
const cooldownStore = new Map();
const pendingRequests = new Set();

function getRemainingCooldown(senderId) {
  const lastUsed = cooldownStore.get(senderId);
  if (!lastUsed) return 0;

  const elapsed = Date.now() - lastUsed;
  const remaining = COOLDOWN_MS - elapsed;

  return remaining > 0 ? remaining : 0;
}

function formatRemainingTime(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds} detik`;
}

async function fetchSafeWaifu(maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await axios.get(API_URL, {
      params: { rating: "safe", limit: 1 },
      timeout: 100_000,
    });

    const image = Array.isArray(data) ? data[0] : data;
    if (!image?.url) continue;

    const tags = image.tags || [];
    const isFlagged = tags.some((tag) => BLOCKED_TAG_PATTERN.test(tag));
    if (!isFlagged) return image;
  }
  return null;
}

const handler = async (m, { conn }) => {
  const senderId = m?.sender;

  if (!senderId) {
    return sendText(
      conn,
      m.chat,
      "Tidak dapat mengenali pengirim pesan, coba lagi.",
      m
    );
  }

  if (pendingRequests.has(senderId)) {
    return sendText(
      conn,
      m.chat,
      "Permintaan sebelumnya masih diproses, harap tunggu.",
      m
    );
  }

  const remainingCooldown = getRemainingCooldown(senderId);
  if (remainingCooldown > 0) {
    return sendText(
      conn,
      m.chat,
      `⏳ Tunggu ${formatRemainingTime(remainingCooldown)} lagi sebelum menggunakan command ini.`,
      m
    );
  }

  pendingRequests.add(senderId);
  cooldownStore.set(senderId, Date.now());

  try {
    const image = await fetchSafeWaifu();

    if (!image) {
      return sendText(
        conn,
        m.chat,
        "Gagal mendapat gambar yang sesuai, coba lagi beberapa saat lagi.",
        m
      );
    }

    const caption = `🌸 Waifu anda hari ini${
      image.artist_name ? `\nArtist: ${image.artist_name}` : ""
    }`;

    await sendImage(conn, m.chat, image.url, caption, m);
  } catch (err) {
    console.error("[waifu]", err);
    sendText(conn, m.chat, `log: ${err}`, m);
  } finally {
    pendingRequests.delete(senderId);
  }
};

handler.command  = ["waifu"];
handler.category = "Menu Fun";
handler.submenu  = "Fun";

export default handler;
