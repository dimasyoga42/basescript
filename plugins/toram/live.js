import axios from "axios";
import * as cheerio from "cheerio";
import moment from "moment-timezone";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
const BASE_URL = "https://en.toram.jp";
const TIMEZONE = "Asia/Jakarta";
const LIVE_KEYWORDS = [
  "live",
  "livestream",
  "live stream",
  "viewer present",
  "bemmo",
  "youtube",
  "watch",
];

const scrapeLiveList = async (limit = 10) => {
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

  // Extract YouTube
  const iframe = $('iframe[src*="youtube"]').first();
  if (iframe.length) {
    detail.youtubeUrl = iframe.attr("src");
  } else {
    $('a[href*="youtube.com"], a[href*="youtu.be"]').each((_, el) => {
      if (!detail.youtubeUrl) detail.youtubeUrl = $(el).attr("href");
    });
    if (!detail.youtubeUrl) {
      const m = content.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
      );
      if (m) detail.youtubeUrl = m[0];
    }
  }

  // Thumbnail from YouTube
  const vidId = detail.youtubeUrl?.match(
    /(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  )?.[1];
  if (vidId)
    detail.thumbnailUrl = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;

  // Programs
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

// .live — detail live terbaru
const Handler = async (m, { conn }) => {
  try {
    await sendText(conn, m.chat, "Checking latest Toram live stream...", m);

    const list = await scrapeLiveList(1);
    if (!list.length)
      return sendText(
        conn,
        m.chat,
        `No live stream found\n${BASE_URL}/?type_code=event`,
        m,
      );

    const latest = list[0];
    const detail = await scrapeDetail(latest.url);
    const now = moment().tz(TIMEZONE).format("DD/MM/YYYY HH:mm");

    let msg = `*TORAM LIVE STREAM*\n${latest.title}\n`;
    if (detail.time) msg += `\nTime: ${detail.time}`;
    if (detail.youtubeUrl) msg += `\nYouTube: ${detail.youtubeUrl}`;
    if (detail.programs.length)
      msg += `\n\nProgram:\n${detail.programs.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
    if (detail.presents) msg += `\n\nViewer Present: Available`;
    msg += `\n\nChecked: ${now} WIB\nSource: ${latest.url}`;

    if (detail.thumbnailUrl) {
      try {
        return await conn.sendMessage(
          m.chat,
          { image: { url: detail.thumbnailUrl }, caption: msg },
          { quoted: m },
        );
      } catch {}
    }

    await sendText(conn, m.chat, msg, m);
  } catch (err) {
    console.error("[live]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

// .livelist — daftar live stream
const liveListHandler = async (m, { conn }) => {
  try {
    await sendText(conn, m.chat, "Fetching live stream list...", m);

    const list = await scrapeLiveList(3);
    if (!list.length) return sendText(conn, m.chat, "No live streams found", m);

    const text = list
      .map(
        (l, i) =>
          `${i + 1}. ${l.title}${l.date ? `\n   ${l.date}` : ""}\n   ${l.url}`,
      )
      .join("\n\n");

    await sendText(conn, m.chat, `*LIVE STREAM LIST*\n\n${text}`, m);
  } catch (err) {
    console.error("[livelist]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

Handler.command = ["live"];
Handler.category = "Menu Toram";
Handler.submenu = "Event";
export default Handler;
