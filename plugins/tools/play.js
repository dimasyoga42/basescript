import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  reactMessage,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";

try {
  const path = execSync("which ffmpeg").toString().trim();
  ffmpeg.setFfmpegPath(path);
} catch {}

const convertToMp3 = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const tmpIn = join(tmpdir(), `neura_${Date.now()}.mp3`);
    const tmpOut = join(tmpdir(), `neura_${Date.now()}_fixed.mp3`);

    const cleanup = () => {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    };

    try {
      writeFileSync(tmpIn, inputBuffer);
      ffmpeg(tmpIn)
        .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
        .format("mp3")
        .on("end", () => {
          try {
            const buffer = readFileSync(tmpOut);
            cleanup();
            resolve(buffer);
          } catch (e) {
            cleanup();
            reject(e);
          }
        })
        .on("error", (err) => {
          cleanup();
          reject(err);
        })
        .save(tmpOut);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
};

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.play|.music|.p\s*/i, "").trim();

    if (!query)
      return sendText(
        conn,
        m.chat,
        "Masukkan judul lagu\nContoh: .play Bohemian Rhapsody",
        m,
      );

    await reactMessage(conn, m.chat, m, "🔍");

    const res = await axios.get(
      `https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`,
    );

    const data = res.data;
    console.log(data);
    if (!data?.data?.url)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });

    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const mp3Buffer = Buffer.from(audioRes.data);
    let fixedBuffer;
    try {
      fixedBuffer = await convertToMp3(mp3Buffer);
    } catch {
      fixedBuffer = mp3Buffer;
    }

    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: data.thumbnail || thumbnail,
      text: `${data.title}\nChannel: ${data.channel}\nDurasi: ${data.fduration}\nViews: ${data.views}\nSize: ${data.data.size}`,
      msg: m,
    });

    await conn.sendMessage(
      m.chat,
      {
        audio: fixedBuffer,
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        contextInfo: {
          title: `${data.title}`,
          body: `${config.BotName}`,
          mediaType: 1,
        },
      },
      { quoted: m },
    );
    // conn.sendOrder(
    //   m.chat,
    //   {
    //     thumbnail: data.thumbnail,
    //     status: 1,
    //     surface: 1,
    //     orderTitle: data.title,
    //     sellerJid: conn.user.jid,
    //     audio: fixedBuffer,
    //     mimetype: "audio/mpeg",
    //     fileName: `${data.title}.mp3`,
    //   },
    //   { quoted: m },
    // );
  } catch (err) {
    console.error("[play]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = "play";
handler.alias = ["music", "p"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
