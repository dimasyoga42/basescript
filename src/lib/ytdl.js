import { execSync }      from 'node:child_process';
import { YtDlp }          from 'ytdlp-nodejs';

function findSystemFfmpeg() {
  try {
    const cmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    return execSync(cmd).toString().trim().split('\n')[0] || null;
  } catch {
    return null;
  }
}

const systemFfmpeg = findSystemFfmpeg();

export const ytdlp = new YtDlp(
  systemFfmpeg ? { ffmpegPath: systemFfmpeg } : {}
);

let readyPromise = null;
export function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const ok = await ytdlp.checkInstallationAsync({ ffmpeg: true });
      if (!ok) {
        console.log('[ytdlp] FFmpeg tidak ditemukan, mendownload...');
        await ytdlp.downloadFFmpeg();
        const okNow = await ytdlp.checkInstallationAsync({ ffmpeg: true });
        if (!okNow) {
          throw new Error('Gagal menyiapkan FFmpeg. Cek izin write/exec di server ini.');
        }
        console.log('[ytdlp] FFmpeg siap.');
      }
    })();
  }
  return readyPromise;
}
