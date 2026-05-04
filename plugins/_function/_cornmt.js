import axios from "axios";
import * as cheerio from "cheerio";
import moment from "moment-timezone";
import path from "path";
import fs from "fs";
import { getUserData } from "../../src/config/func.js";

const BASE_URL = "http://id.toram.jp";
const TIMEZONE = "Asia/Jakarta";
const db_path = path.resolve("db", "mt.json");
const cache_path = path.resolve("db", "mt_cache.json");

// ─── Persistent Cache ─────────────────────────────────────────────────────────
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
    console.error("[cronMt] Gagal simpan cache:", err.message);
  }
};

// ─── Cek tanggal posting = hari ini (WIB) ────────────────────────────────────

const isToday = (dateStr) => {
  if (!dateStr) {
    console.warn("[cronMt] Tanggal kosong, skip.");
    return false;
  }

  // Bersihkan bracket fullwidth Jepang dan karakter non-standar
  // Contoh: "［2026-05-04］" → "2026-05-04"
  const cleaned = dateStr
    .replace(/［/g, "")
    .replace(/］/g, "")
    .replace(/[\[\]【】〔〕]/g, "")
    .trim();

  if (!cleaned) {
    console.warn("[cronMt] Tanggal kosong setelah dibersihkan:", dateStr);
    return false;
  }

  const today = moment().tz(TIMEZONE);

  // Format umum yang dipakai website Toram ID
  const formats = [
    "YYYY.MM.DD",
    "YYYY/MM/DD",
    "YYYY-MM-DD",
    "DD/MM/YYYY",
    "MM/DD/YYYY",
    "MMM DD, YYYY",
    "MMMM DD, YYYY",
    "DD MMM YYYY",
  ];

  for (const fmt of formats) {
    const parsed = moment(cleaned, fmt, true);
    if (parsed.isValid()) {
      const match = parsed.isSame(today, "day");
      console.log(
        `[cronMt] Tanggal posting: ${parsed.format("DD/MM/YYYY")} | Hari ini: ${today.format("DD/MM/YYYY")} | Match: ${match}`,
      );
      return match;
    }
  }

  // Fallback parse bebas
  const fallback = moment(cleaned);
  if (fallback.isValid()) {
    const match = fallback.isSame(today, "day");
    console.warn(`[cronMt] Fallback parse "${cleaned}" → match: ${match}`);
    return match;
  }

  console.warn("[cronMt] Format tanggal tidak dikenali:", cleaned);
  return false;
};

// ─── Scrape news update/maintenance terbaru ───────────────────────────────────

const scrapeMtList = async (limit = 5) => {
  const res = await axios.get(`${BASE_URL}/?type_code=update#contentArea`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);
  const list = [];

  $(".common_list .news_border").each((i, el) => {
    if (list.length >= limit) return false;

    const anchor = $(el).find("a");
    const title = anchor.text().trim();
    const href = anchor.attr("href");

    if (!title || !href) return;

    const dateText = $(el)
      .find('[class*="date"], time, .date')
      .first()
      .text()
      .trim();

    list.push({
      title: title.replace(/\s+/g, " ").trim(),
      url: href.startsWith("http") ? href : BASE_URL + href,
      date: dateText,
    });
  });

  return list;
};

// ─── Scrape isi detail berita maintenance ─────────────────────────────────────

const scrapeDetail = async (url) => {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 15000,
  });

  const $ = cheerio.load(res.data);

  // Ambil konten utama dari #news div
  const raw = $("#news").find("div").text().trim();

  // Potong sebelum "Kembali ke atas"
  const content = raw.split("Kembali ke atas")[0].trim();

  // Coba ambil thumbnail/gambar pertama di dalam #news
  const imgSrc = $("#news img").first().attr("src") || "";
  const thumbnailUrl = imgSrc
    ? imgSrc.startsWith("http")
      ? imgSrc
      : BASE_URL + imgSrc
    : "";

  return { content, thumbnailUrl };
};

// ─── Kirim notifikasi ke semua grup aktif ─────────────────────────────────────

const sendMtNotif = async (conn, latest, detail) => {
  let db = [];
  try {
    db = getUserData(db_path);
  } catch {
    console.error("[cronMt] Gagal baca mt.json");
    return;
  }

  const activeGroups = db.filter((item) => item.status === true);
  if (!activeGroups.length) {
    console.log("[cronMt] Tidak ada grup aktif.");
    return;
  }

  const now = moment().tz(TIMEZONE).format("DD/MM/YYYY HH:mm");

  let msg = `🔧 *TORAM UPDATE / MAINTENANCE*\n`;
  msg += `📌 ${latest.title}\n`;
  if (detail.content) msg += `\n${detail.content}`;
  msg += `\n\n🕐 Checked: ${now} WIB`;
  msg += `\n🔗 Source: ${latest.url}`;

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
      console.log(`[cronMt] Notif terkirim ke ${group.id}`);
    } catch (err) {
      console.error(`[cronMt] Gagal kirim ke ${group.id}:`, err.message);
    }
  }
};

// ─── Main cron ────────────────────────────────────────────────────────────────

export const cronMt = async (conn) => {
  try {
    const { set: sentSet, raw: sentRaw } = loadCache();

    const list = await scrapeMtList(5);
    if (!list.length) {
      console.log("[cronMt] Tidak ada update/maintenance ditemukan.");
      return;
    }

    for (const latest of list) {
      // 1. Skip jika sudah pernah dikirim (persistent cache)
      if (sentSet.has(latest.url)) {
        console.log(`[cronMt] Skip (sudah dikirim): ${latest.title}`);
        continue;
      }

      // 2. Skip jika bukan hari ini
      if (!isToday(latest.date)) {
        console.log(
          `[cronMt] Skip (bukan hari ini): ${latest.title} [${latest.date}]`,
        );
        continue;
      }

      console.log("[cronMt] ✅ Update hari ini belum dikirim:", latest.title);

      // 3. Ambil detail konten
      const detail = await scrapeDetail(latest.url);

      // 4. Kirim ke semua grup aktif
      await sendMtNotif(conn, latest, detail);

      // 5. Simpan ke cache agar tidak kirim ulang
      sentRaw.push({ url: latest.url, sentAt: new Date().toISOString() });
      sentSet.add(latest.url);
      saveCache(sentRaw);

      // Kirim 1 update per cron run, stop setelah berhasil
      break;
    }
  } catch (err) {
    console.error("[cronMt] Error:", err.message);
  }
};
