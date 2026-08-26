import fs                from 'node:fs';
import path              from 'node:path';
import { fileURLToPath } from 'node:url';
import { YtDlp }         from 'ytdlp-nodejs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR   = path.join(__dirname, 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const ytdlp = new YtDlp();

const handler = async (m, { conn }) => {
  const url = m.text.replace(/^[./#!]ytmp3/i, '').trim();

  if (!url) {
    return conn.sendMessage(
      m.chat,
      { text: 'Masukkan link YouTube setelah .ytmp3\n\nContoh: .ytmp3 https://youtu.be/xxxxx' },
      { quoted: m }
    );
  }

  if (!/youtu\.?be/.test(url)) {
    return conn.sendMessage(m.chat, { text: 'Link yang kamu kirim bukan link YouTube yang valid.' }, { quoted: m });
  }

  const filePath = path.join(TMP_DIR, `${Date.now()}.mp3`);

  try {
    await conn.sendMessage(m.chat, { text: '⏳ Sedang mengunduh audio, mohon tunggu...' }, { quoted: m });

    await ytdlp
      .stream(url)
      .filter('audioonly')
      .type('mp3')
      .pipeAsync(fs.createWriteStream(filePath));

    await conn.sendMessage(
      m.chat,
      {
        audio: fs.readFileSync(filePath),
        mimetype: 'audio/mpeg',
        fileName: 'audio.mp3',
      },
      { quoted: m }
    );
  } catch (err) {
    console.error('[ytmp3] error:', err);
    await conn.sendMessage(m.chat, { text: `Gagal mengunduh audio.\n${err.message || err}` }, { quoted: m });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

handler.command  = 'ytmp3';
handler.category = 'Menu Tools';

export default handler;
