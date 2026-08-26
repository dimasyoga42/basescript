import fs                from 'node:fs';
import path              from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureReady, ytdlp } from '../../src/lib/ytdl';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR   = path.join(__dirname, '..', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const MAX_VIDEO_SIZE = 64 * 1024 * 1024; // ~64MB, batas aman kirim video WA

const handler = async (m, { conn }) => {
  const url = m.text.replace(/^[./#!](ytmp4|ytdlmp4)/i, '').trim();

  if (!url) {
    return conn.sendMessage(
      m.chat,
      { text: 'Masukkan link YouTube setelah .ytdlmp4\n\nContoh: .ytdlmp4 https://youtu.be/xxxxx' },
      { quoted: m }
    );
  }

  if (!/youtu\.?be/.test(url)) {
    return conn.sendMessage(m.chat, { text: 'Link yang kamu kirim bukan link YouTube yang valid.' }, { quoted: m });
  }

  const filePath = path.join(TMP_DIR, `${Date.now()}.mp4`);

  try {
    await ensureReady();

    await conn.sendMessage(m.chat, { text: '⏳ Sedang mengunduh video, mohon tunggu...' }, { quoted: m });

    await ytdlp
      .stream(url)
      .filter('audioandvideo')
      .quality('highest')
      .type('mp4')
      .pipeAsync(fs.createWriteStream(filePath));

    const { size } = fs.statSync(filePath);

    if (size > MAX_VIDEO_SIZE) {
      await conn.sendMessage(
        m.chat,
        { document: fs.readFileSync(filePath), mimetype: 'video/mp4', fileName: 'video.mp4' },
        { quoted: m }
      );
    } else {
      await conn.sendMessage(
        m.chat,
        { video: fs.readFileSync(filePath), mimetype: 'video/mp4', fileName: 'video.mp4' },
        { quoted: m }
      );
    }
  } catch (err) {
    console.error('[ytdlmp4] error:', err);
    await conn.sendMessage(m.chat, { text: `Gagal mengunduh video.\n${err.message || err}` }, { quoted: m });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

handler.command  = 'ytmp4';
handler.category = 'Menu Tools';

export default handler;
