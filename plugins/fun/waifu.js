import axios from "axios";
import { config } from "../../config.js";
import {
  sendFancyText,
  sendImage,
  sendText,
} from "../../src/config/message.js";

const API_URL = "https://api.nekosapi.com/v4/images/random";

// Tag yang mengindikasikan konten kurang pantas untuk command umum,
// dipakai sebagai filter tambahan karena rating "safe" dari API ini
// kadang masih meloloskan gambar semacam ini.
const BLOCKED_TAG_PATTERN =
  /(nude|naked|nipple|breast|panty|panties|underwear|ecchi|hentai|pussy|sex|cum|topless|lingerie)/i;

async function fetchSafeWaifu(maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await axios.get(API_URL, {
      params: { rating: "safe", limit: 1 },
      timeout: 10_000,
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
    sendText(conn, m.chat, `log: ${err.message}`, m);
  }
};

handler.command  = ["waifu"];
handler.category = "Menu Fun";
handler.submenu  = "Fun";

export default handler;
