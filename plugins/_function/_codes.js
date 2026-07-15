import axios from "axios";
import moment from "moment-timezone";
import path from "path";
import fs from "fs";
import { getUserData } from "../../src/config/func.js";

const API_URL =
  "https://neurapi.mochinime.cyou/api/etc/code/578244723349782538?limit=1";
const TIMEZONE = "Asia/Jakarta";

// Cek apakah timestamp postingan = hari ini (WIB)
const isToday = (isoTimestamp) => {
  if (!isoTimestamp) return false;

  const posted = moment(isoTimestamp);
  if (!posted.isValid()) return false;

  const today = moment().tz(TIMEZONE);
  return posted.tz(TIMEZONE).isSame(today, "day");
};
const db_path = path.resolve("db", "code.json");
const cache_path = path.resolve("db", "code_cache.json");

// Lock sederhana supaya cron tidak overlap (mencegah pesan terkirim 2x)
let isRunning = false;

const loadCache = () => {
  try {
    if (!fs.existsSync(cache_path)) {
      return { set: new Set(), raw: [] };
    }

    const raw = JSON.parse(fs.readFileSync(cache_path, "utf8"));

    if (!Array.isArray(raw)) {
      return { set: new Set(), raw: [] };
    }

    const cutoff = moment().tz(TIMEZONE).subtract(7, "days");
    const filtered = raw.filter((item) => moment(item.sentAt).isAfter(cutoff));

    return {
      set: new Set(filtered.map((item) => `${item.messageId}|${item.groupId}`)),
      raw: filtered,
    };
  } catch {
    return { set: new Set(), raw: [] };
  }
};

const saveCache = (raw) => {
  try {
    fs.writeFileSync(cache_path, JSON.stringify(raw, null, 2), "utf-8");
  } catch (err) {
    console.error("[cronCode] Gagal simpan cache:", err.message);
  }
};

// ─── Bersihkan caption dari format Discord ────────────────────────────────────

const buildCaption = (content = "") =>
  content
    .replace(/<@&\d+>/g, "")
    .replace(/\[([^\]]+)\]\(<([^>]+)>\)/g, "$1: $2")
    .replace(/`/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();

// ─── Ambil kode terbaru dari API ──────────────────────────────────────────────

const fetchLatestCode = async () => {
  const { data } = await axios.get(API_URL, { timeout: 15000 });
  const message = data?.data?.[0];

  if (!message?.id || !message?.attachments?.length) {
    return null;
  }

  return {
    id: message.id,
    imageUrl: message.attachments[0].url,
    caption: buildCaption(message.content),
    timestamp: message.timestamp,
  };
};

// ─── Kirim ke semua grup aktif ─────────────────────────────────────────────────

const sendCodeNotif = async (conn, latest, sentRaw, sentSet) => {
  let db = [];

  try {
    db = getUserData(db_path);
  } catch {
    console.error("[cronCode] Gagal baca code.json");
    return;
  }

  const activeGroups = db.filter((item) => item.status === true);

  if (!activeGroups.length) {
    console.log("[cronCode] Tidak ada grup aktif.");
    return;
  }

  for (const group of activeGroups) {
    const cacheKey = `${latest.id}|${group.id}`;

    if (sentSet.has(cacheKey)) {
      console.log(`[cronCode] Skip ${group.id} (sudah pernah dikirim)`);
      continue;
    }

    try {
      await conn.sendMessage(group.id, {
        image: { url: latest.imageUrl },
        caption: latest.caption,
      });

      console.log(`[cronCode] Kode terkirim ke ${group.id}`);

      sentRaw.push({
        messageId: latest.id,
        groupId: group.id,
        sentAt: new Date().toISOString(),
      });

      sentSet.add(cacheKey);

      // Simpan langsung tiap kirim sukses supaya kalau error di tengah loop,
      // grup yang sudah terkirim tidak dikirim ulang.
      saveCache(sentRaw);
    } catch (err) {
      console.error(`[cronCode] Gagal kirim ke ${group.id}:`, err.message);
    }
  }
};

// ─── Main cron ────────────────────────────────────────────────────────────────

export const cronCode = async (conn) => {
  if (isRunning) {
    console.log("[cronCode] Masih berjalan, lewati eksekusi ini.");
    return;
  }

  isRunning = true;

  try {
    const { set: sentSet, raw: sentRaw } = loadCache();

    const latest = await fetchLatestCode();
    if (!latest) {
      console.log("[cronCode] Tidak ada kode baru ditemukan.");
      return;
    }

    if (!isToday(latest.timestamp)) {
      console.log(
        `[cronCode] Skip (bukan postingan hari ini): ${latest.id} [${latest.timestamp}]`,
      );
      return;
    }

    const db = getUserData(db_path);
    const activeGroups = db.filter((item) => item.status === true);
    const alreadySentToAll =
      activeGroups.length > 0 &&
      activeGroups.every((group) => sentSet.has(`${latest.id}|${group.id}`));

    if (alreadySentToAll) {
      console.log(`[cronCode] Skip (sudah dikirim ke semua grup): ${latest.id}`);
      return;
    }

    console.log("[cronCode] Kode baru akan diproses:", latest.id);
    await sendCodeNotif(conn, latest, sentRaw, sentSet);
  } catch (err) {
    console.error("[cronCode] Error:", err.message);
  } finally {
    isRunning = false;
  }
};
