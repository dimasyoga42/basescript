import { exec }          from 'node:child_process';
import { promisify }     from 'node:util';
import fs                from 'node:fs';
import path              from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactMessage, sendText } from '../../src/config/message.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR   = path.join(__dirname, 'tmp');

fs.mkdirSync(TMP_DIR, { recursive: true });

const handler = async (m, { conn }) => {
  try {
    const link = m.text.replace(/\.ytdl\s*/i, '').trim();

    if (!link.startsWith('http')) {
      return conn.sendMessage(m.chat, {text: "format anda salah gunakan .ytdl <url>"}, {quoted: m});
    }

    await reactMessage(conn, m.chat, m, "⌛");

    // Download langsung ke folder tmp
    const outTemplate = path.join(TMP_DIR, '%(title)s.%(ext)s');
    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outTemplate}" "${link}"`,
      { maxBuffer: 50 * 1024 * 1024 }
    );

    // Cari file mp3 terbaru di tmp
    const filePath = fs.readdirSync(TMP_DIR)
      .filter(f => f.endsWith('.mp3'))
      .map(f => ({ f, t: fs.statSync(path.join(TMP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0]?.f;

    if (!filePath) throw new Error('File mp3 tidak ditemukan');

    const fullPath = path.join(TMP_DIR, filePath);

    // Kirim langsung ke chat
    await conn.sendMessage(m.chat, {
      audio: fs.readFileSync(fullPath),
      mimetype: 'audio/mpeg',
      fileName: filePath,
      ptt: false,
    }, { quoted: m });

    // Hapus file tmp setelah terkirim
    fs.unlinkSync(fullPath);

  } catch (err) {
    console.error('[ytdl]', err.message);
    sendText(conn, m.chat, `Gagal: ${err.message}`, m);
  }
};

handler.command = 'ytdl';
handler.category    = 'Menu Tools';

export default handler;
