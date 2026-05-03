import axios from "axios";
import * as cheerio from "cheerio";
import moment from "moment-timezone";
import path from "path";
import { config } from "../../config.js";
import { getUserData } from "../../src/config/func.js";

const BASE_URL = "https://en.toram.jp";
const TIMEZONE = "Asia/Jakarta";
const db_path = path.resolve("db", "live.json");

const LIVE_KEYWORDS = [
  "live",
  "livestream",
  "live stream",
  "viewer present",
  "bemmo",
  "youtube",
  "watch",
];

const sentCache = new Set();

const scrapeLiveList = async (limit = 1) => {
  const res = await axios.get(`${BASE_URL}/?type_code=event`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);
  const list = [];

  $('a[href*="/information/detail/"]').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");
    const isLive = LIVE_KEYWORDS.some((k) => title.toLowerCase().includes(k));

    if (isLive && title && list.length < limit) {
      const date = $(el)
        .closest("li")
        .find('[class*="date"], time')
        .first()
        .text()
        .trim();

      list.push({
        title: title.replace(/\s+/g, " ").trim(),
        url: href.startsWith("http") ? href : BASE_URL + href,
        date,
      });
    }
  });

  return list;
};

const scrapeDetail = async (url) => {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);
  const content = $.text();
  const detail = {
    time: "",
    youtubeUrl: "",
    thumbnailUrl: "",
    programs: [],
    presents: false,
  };

  // Extract time
  for (const pattern of [
    /(\d{1,2}\/\d{1,2}\([A-Za-z]+\)\s+\d{1,2}:\d{2}\s+[AP]M\s+\(JST\/?\s*GMT\+9\))/i,
    /Start:\s*(.+?(?:JST|GMT\+9))/i,
  ]) {
    const match = content.match(pattern);
    if (match) {
      detail.time = match[1].trim();
      break;
    }
  }

  const iframe = $('iframe[src*="youtube"]').first();
  if (iframe.length) {
    detail.youtubeUrl = iframe.attr("src");
  } else {
    $('a[href*="youtube.com"], a[href*="youtu.be"]').each((_, el) => {
      if (!detail.youtubeUrl) detail.youtubeUrl = $(el).attr("href");
    });
    if (!detail.youtubeUrl) {
      const match = content.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      );
      if (match) detail.youtubeUrl = match[0];
    }
  }

  const vidId = detail.youtubeUrl?.match(
    /(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  )?.[1];
  if (vidId) {
    detail.thumbnailUrl = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
  }

  // Program list
  const prog = content.match(
    /★:Live Contents([\s\S]*?)(?:Live Viewer Present|BeMMO Show|\*Only the players)/i,
  );
  if (prog) {
    detail.programs = prog[1]
      .split("\n")
      .filter((l) => l.trim().startsWith("★:") || l.trim().startsWith("・"))
      .map((l) => l.replace(/^[★・]\s*:?\s*/, "").trim())
      .filter(Boolean);
  }

  detail.presents = /viewer present|lucky draw|keyword/i.test(content);
  return detail;
};

const sendLiveNotif = async (conn, latest, detail) => {
  let db = [];
  try {
    db = getUserData(db_path);
  } catch {
    console.error("[cronLive] Gagal baca live.json");
    return;
  }

  const activeGroups = db.filter((item) => item.status === true);
  if (!activeGroups.length) {
    console.log("[cronLive] Tidak ada grup aktif.");
    return;
  }

  const now = moment().tz(TIMEZONE).format("DD/MM/YYYY HH:mm");

  // Susun pesan notifikasi
  let msg = `*TORAM LIVE STREAM*\n${latest.title}\n`;
  if (detail.time) msg += `\nTime: ${detail.time}`;
  if (detail.youtubeUrl) msg += `\n▶️ YouTube: ${detail.youtubeUrl}`;
  if (detail.programs.length)
    msg += `\n\nProgram:\n${detail.programs.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
  if (detail.presents) msg += `\n\nViewer Present: Available`;
  msg += `\n\n🕐 Checked: ${now} WIB\n🔗 Source: ${latest.url}`;

  // Kirim ke semua grup aktif
  for (const group of activeGroups) {
    try {
      if (detail.thumbnailUrl) {
        await conn.sendMessage(group.id, {
          image: { url: detail.thumbnailUrl },
          caption: msg,
        });
      } else {
        await conn.sendMessage(group.id, { text: msg });
      }
      console.log(`[cronLive] Notif terkirim ke ${group.id}`);
    } catch (err) {
      console.error(`[cronLive] Gagal kirim ke ${group.id}:`, err.message);
    }
  }
};

export const cronLive = async (conn) => {
  try {
    const list = await scrapeLiveList(1);
    if (!list.length) {
      console.log("[cronLive] Tidak ada live ditemukan.");
      return;
    }

    const latest = list[0];

    if (sentCache.has(latest.url)) {
      console.log("[cronLive] Live sudah dikirim sebelumnya, skip.");
      return;
    }

    console.log("[cronLive] Live baru ditemukan:", latest.title);

    const detail = await scrapeDetail(latest.url);

    await sendLiveNotif(conn, latest, detail);

    sentCache.add(latest.url);
  } catch (err) {
    console.error("[cronLive] Error:", err.message);
  }
};
