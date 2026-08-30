import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import { fileURLToPath } from "url";
import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";

const execPromise = util.promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.(play|p)\s*/i, "").trim();
    if (!query)
      return sendText(conn, m.chat, "Enter song title\nExample: .play multo", m);

    await sendText(conn, m.chat, "⏳ Searching & processing...", m);


    const { data } = await axios.get(`https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`);

    if (!data.status) throw new Error("Failed to fetch data from neoxr API");

    const { title, duration, channel, data: audio } = data;
    const downloadUrl = audio.url;

    const outputDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${Date.now()}.mp3`);

    // Full ffmpeg: ambil stream dari URL lalu encode ulang jadi mp3 128kbps
    const ffmpegCmd = `ffmpeg -y -i "${downloadUrl}" -vn -acodec libmp3lame -b:a 128k "${outputPath}"`;
    await execPromise(ffmpegCmd);

    await conn.sendMessage(
      m.chat,
      {
        audio: fs.readFileSync(outputPath),
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      },
      { quoted: m },
    );

    fs.unlinkSync(outputPath);
  } catch (err) {
    console.error("[play]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = "play";
handler.alias = ["p"]
handler.category = "Menu Tools";
handler.submenu = "Downloader";

export default handler;
