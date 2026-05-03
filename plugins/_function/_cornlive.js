import axios from "axios";
import * as cheerio from "cheerio";
import moment from "moment-timezone";
import path from "path";
import fs from "fs";
import { config } from "../../config.js";
import { getUserData } from "../../src/config/func.js";

const BASE_URL = "https://en.toram.jp";
const TIMEZONE = "Asia/Jakarta";
const db_path = path.resolve("db", "live.json");
const cache_path = path.resolve("db", "live_cache.json");

// ─── Persistent Cache (dengan timestamp) ─────────────────────────────────────
// Format: [{ url: string, sentAt: ISO string }, ...]
// Cache otomatis bersih setelah 7 hari

const loadCache = () => {
  try {
    if (!fs.existsSync(cache_path)) return { set: new Set(), raw: [] };

    const raw = JSON.parse(fs.readFileSync(cache_path, "utf-8"));
    if (!Array.isArray(raw)) return { set: new Set(), raw: [] };

    // Migrate format lama (array of string)
    const normalized =
      typeof raw[0] === "string"
        ? raw.map((url) => ({ url, sentAt: new Date().toISOString() }))
        : raw;

    // Buang cache lebih dari 7 hari
    const cutoff = moment().tz(TIMEZONE).subtract(7, "days");
    const filtered = normalized.filter((item) =>
      moment(item.sentAt).isAfter(cutoff),
    );

    return { set: new Set(filtered.map((i) => i.url)), raw: filtered };
  } catch {
    return { set: new Set(), raw: [] };
  }
};

const saveCache = (raw) => {
  try {
    fs.writeFileSync(cache_path, JSON.stringify(raw, null, 2), "utf-8");
  } catch (err) {
    console.error("[cronLive] Gagal simpan cache:", err.message);
  }
};

// ─── Keywords live ────────────────────────────────────────────────────────────

const LIVE_KEYWORDS = [
  "live",
  "livestream",
  "live stream",
  "viewer present",
  "bemmo",
  "youtube",
  "watch",
];

// ─── Scrape daftar event live ─────────────────────────────────────────────────

const scrapeLiveList = async (limit = 5) => {
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

// ─── Cek tanggal event = hari ini (WIB) ──────────────────────────────────────

const isToday = (dateStr) => {
  if (!dateStr) {
    // Jika tidak ada tanggal sama sekali, lewati agar aman
    console.warn("[cronLive] Tanggal event kosong, skip.");
    return false;
  }

  const today = moment().tz(TIMEZONE);

  // Format tanggal yang umum dipakai Toram website
  const formats = [
    "YYYY.MM.DD",
    "YYYY/MM/DD",
    "YYYY-MM-DD",
    "MMM DD, YYYY",
    "MMMM DD, YYYY",
    "DD/MM/YYYY",
    "MM/DD/YYYY",
  ];

  for (const fmt of formats) {
    const parsed = moment(dateStr, fmt, true);
    if (parsed.isValid()) {
      const match = parsed.isSame(today, "day");
      console.log(
        `[cronLive] Tanggal event: ${parsed.format("DD/MM/YYYY")} | Hari ini: ${today.format("DD/MM/YYYY")} | Match: ${match}`,
      );
      return match;
    }
  }

  // Fallback parse bebas
  const fallback = moment(dateStr);
  if (fallback.isValid()) {
    const match = fallback.isSame(today, "day");
    console.warn(`[cronLive] Fallback parse "${dateStr}" → match: ${match}`);
    return match;
  }

  console.warn("[cronLive] Format tanggal tidak dikenali:", dateStr);
  return false;
};

// ─── Scrape detail event ──────────────────────────────────────────────────────

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

// ─── Kirim notifikasi ke semua grup aktif ─────────────────────────────────────

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

  let msg = `🔴 *TORAM LIVE STREAM*\n${latest.title}\n`;
  if (detail.time) msg += `\n🕐 Time: ${detail.time}`;
  if (detail.youtubeUrl) msg += `\n▶️ YouTube: ${detail.youtubeUrl}`;
  if (detail.programs.length)
    msg += `\n\n📋 Program:\n${detail.programs.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
  if (detail.presents) msg += `\n\n🎁 Viewer Present: Available`;
  msg += `\n\n🕐 Checked: ${now} WIB\n🔗 Source: ${latest.url}`;

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

// ─── Main cron ────────────────────────────────────────────────────────────────

export const cronLive = async (conn) => {
  try {
    const { set: sentSet, raw: sentRaw } = loadCache();

    const list = await scrapeLiveList(5);
    if (!list.length) {
      console.log("[cronLive] Tidak ada live ditemukan.");
      return;
    }

    for (const latest of list) {
      // 1. Skip jika sudah pernah dikirim (persistent)
      if (sentSet.has(latest.url)) {
        console.log(`[cronLive] Skip (sudah dikirim): ${latest.title}`);
        continue;
      }

      // 2. Skip jika bukan hari ini
      if (!isToday(latest.date)) {
        console.log(
          `[cronLive] Skip (bukan hari ini): ${latest.title} [${latest.date}]`,
        );
        continue;
      }

      console.log("[cronLive] ✅ Live hari ini belum dikirim:", latest.title);

      // 3. Ambil detail
      const detail = await scrapeDetail(latest.url);

      // 4. Kirim ke semua grup aktif
      await sendLiveNotif(conn, latest, detail);

      // 5. Simpan ke cache agar tidak kirim ulang
      sentRaw.push({ url: latest.url, sentAt: new Date().toISOString() });
      sentSet.add(latest.url);
      saveCache(sentRaw);

      // Kirim 1 live per cron run, stop setelah berhasil
      break;
    }
  } catch (err) {
    console.error("[cronLive] Error:", err.message);
  }
};
