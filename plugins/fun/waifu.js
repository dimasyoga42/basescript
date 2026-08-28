import axios from "axios";
import {
  sendImage,
  sendText,
} from "../../src/config/message.js";

const API_URL = "https://api.nekosapi.com/v4/images/random";

const BLOCKED_TAG_PATTERN =
  /(nude|naked|nipple|breast|panty|panties|underwear|ecchi|hentai|pussy|sex|cum|topless|lingerie)/i;

const COOLDOWN_MS = 10_000;
const MAX_API_ATTEMPTS = 100;
const REQUEST_TIMEOUT = 400_000;

const cooldownStore = new Map();
const pendingRequests = new Set();

function getRemainingCooldown(senderId) {
  const lastUsed = cooldownStore.get(senderId);

  if (!lastUsed) {
    return 0;
  }

  const elapsed = Date.now() - lastUsed;
  const remaining = COOLDOWN_MS - elapsed;

  if (remaining <= 0) {
    cooldownStore.delete(senderId);
    return 0;
  }

  return remaining;
}

function formatRemainingTime(ms) {
  return `${Math.ceil(ms / 1000)} detik`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error) {
  if (error instanceof AggregateError) {
    const errors = Array.from(error.errors || []);

    const messages = errors
      .map((item) => {
        if (!item) return null;

        return (
          item.code ||
          item.message ||
          String(item)
        );
      })
      .filter(Boolean);

    return messages.length > 0
      ? messages.join(", ")
      : "Multiple connection errors";
  }

  if (axios.isAxiosError(error)) {
    if (error.response) {
      return `HTTP ${error.response.status}`;
    }

    return error.code || error.message || "Axios request failed";
  }

  if (error instanceof Error) {
    return error.code || error.message;
  }

  return String(error);
}

async function fetchSafeWaifu(maxAttempts = MAX_API_ATTEMPTS) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(API_URL, {
        params: {
          rating: "safe",
          limit: 1,
        },
        timeout: REQUEST_TIMEOUT,
        validateStatus: (status) => status >= 200 && status < 300,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      });

      const data = response.data;

      const image = Array.isArray(data)
        ? data[0]
        : Array.isArray(data?.items)
          ? data.items[0]
          : Array.isArray(data?.images)
            ? data.images[0]
            : data;

      if (!image?.url) {
        continue;
      }

      const tags = Array.isArray(image.tags)
        ? image.tags
        : [];

      const isFlagged = tags.some((tag) => {
        const tagName =
          typeof tag === "string"
            ? tag
            : tag?.name || "";

        return BLOCKED_TAG_PATTERN.test(tagName);
      });

      if (!isFlagged) {
        return image;
      }
    } catch (error) {
      lastError = error;

      console.error(
        `[waifu] attempt ${attempt}/${maxAttempts}:`,
        getErrorMessage(error)
      );

      if (attempt < maxAttempts) {
        await sleep(1000 * attempt);
      }
    }
  }

  if (lastError) {
    throw lastError;
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
      `⏳ Tunggu ${formatRemainingTime(
        remainingCooldown
      )} lagi sebelum menggunakan command ini.`,
      m
    );
  }

  pendingRequests.add(senderId);

  try {
    const image = await fetchSafeWaifu();

    if (!image?.url) {
      return sendText(
        conn,
        m.chat,
        "Gagal mendapat gambar yang sesuai, coba lagi beberapa saat lagi.",
        m
      );
    }

    cooldownStore.set(senderId, Date.now());

    const artistName =
      image.artist_name ||
      image.artist?.name ||
      null;

    const caption = [
      "🌸 Waifu anda hari ini",
      artistName
        ? `Artist: ${artistName}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    await sendImage(
      conn,
      m.chat,
      image.url,
      caption,
      m
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    console.error(
      "[waifu] request failed:",
      errorMessage
    );

    await sendText(
      conn,
      m.chat,
      "Terjadi kesalahan saat mengambil gambar waifu. Silakan coba lagi beberapa saat.",
      m
    );
  } finally {
    pendingRequests.delete(senderId);
  }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";

export default handler;
