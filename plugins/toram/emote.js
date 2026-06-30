import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";

// ─── HELPER: convert gif (dari URL) ke mp4 buffer ─────
async function gifUrlToMp4Buffer(gifUrl) {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(
    tmpDir,
    `in-${Date.now()}-${Math.random().toString(36).slice(2)}.gif`,
  );
  const outputPath = path.join(
    tmpDir,
    `out-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`,
  );

  try {
    const res = await axios.get(gifUrl, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    fs.writeFileSync(inputPath, res.data);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
        "-i",
        inputPath,
        "-movflags",
        "faststart",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-y",
        outputPath,
      ]);

      let stderr = "";
      ffmpeg.stderr.on("data", (d) => (stderr += d.toString()));

      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exit code ${code}: ${stderr}`));
      });

      ffmpeg.on("error", (err) => reject(err));
    });

    const buffer = fs.readFileSync(outputPath);
    return buffer;
  } finally {
    // cleanup, jangan biarkan file numpuk walau gagal
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(".emot", "").trim();

    // ─── LIST SEMUA EMOT ───────────────────────────────
    if (!name) {
      const { data: list, error } = await supa.from("emot").select("name");

      if (error || !list || list.length === 0) {
        return sendFancyText(conn, m.chat, {
          title: config.BotName,
          body: `Developer By ${config.OwnerName}`,
          thumbnail,
          text: "Daftar emot kosong atau gagal dimuat.",
          quoted: m,
        });
      }

      return conn.sendButton(m.chat, {
        text: `Daftar Emot (${list.length})\n- gunakan .emot [nama Emot yang dicari]`,
        footer: config.OwnerName,
        buttons: list.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.emot ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar emot",
      });
    }

    // ─── CARI EMOT BERDASARKAN NAMA ────────────────────
    const { data } = await supa
      .from("emot")
      .select("name, url")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (!data) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    }

    const url = data.url;
    const ext = url.toLowerCase().split("?")[0].split(".").pop();

    const isGif = ext === "gif";
    const isVideo = ["mp4", "webm", "mkv", "mov", "3gp"].includes(ext);
    const isWebp = ext === "webp";

    // ─── KIRIM SESUAI TIPE ─────────────────────────────
    if (isGif) {
      try {
        // coba convert gif ke mp4 dulu (hasil lebih stabil di WA)
        const mp4Buffer = await gifUrlToMp4Buffer(url);
        await conn.sendMessage(
          m.chat,
          {
            video: mp4Buffer,
            gifPlayback: true,
            caption: data.name,
          },
          { quoted: m },
        );
      } catch (convertErr) {
        console.error(
          "gif convert error, fallback ke url langsung:",
          convertErr.message,
        );
        // fallback: kirim langsung pakai url tanpa convert
        await conn.sendMessage(
          m.chat,
          {
            video: { url },
            mimetype: "image/gif",
            gifPlayback: true,
            caption: data.name,
          },
          { quoted: m },
        );
      }
    } else if (isVideo) {
      await conn.sendMessage(
        m.chat,
        {
          video: { url },
          caption: data.name,
        },
        { quoted: m },
      );
    } else if (isWebp) {
      await conn.sendMessage(
        m.chat,
        {
          sticker: { url },
        },
        { quoted: m },
      );
    } else {
      // default: jpg, jpeg, png, bmp, dll dianggap image
      await conn.sendMessage(
        m.chat,
        {
          image: { url },
          caption: data.name,
        },
        { quoted: m },
      );
    }
  } catch (err) {
    console.error("emot error:", err.message);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["emot"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
