import axios from "axios";
import {
  reactMessage,
  sendFancyText,
  sendFancyTextModif,
  sendText,
} from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^(\.play|\.music|\.p)\s*/i, "").trim();
    if (!query) {
      return sendText(
        conn,
        m.chat,
        "Masukkan judul lagu\nContoh: .play Dia Anji",
        m,
      );
    }

    await reactMessage(conn, m.chat, m, "🔍");

    const res = await axios.get(
      `https://neurapi.mochinime.cyou/api/etc/play?query=${encodeURIComponent(query)}`,
      { timeout: 100000 },
    );

    const data = res.data;
    console.log("[PLAY API]", data);

    if (!data?.success || !data?.mp3?.download_url) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound,
        msg: m,
      });
    }

    await sendFancyTextModif(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: data.thumbnail || thumbnail,
      text: `🎵 ${data.title}\n📺 Channel: ${data.channel}\n⏱️ Durasi: ${data.duration}\n👁️ Views: ${data.views}`,
      msg: m,
    });

    await reactMessage(conn, m.chat, m, "⬇️");

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: data.mp3.download_url },
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        ptt: false,
      },
      { quoted: m },
    );

    await reactMessage(conn, m.chat, m, "✅");
  } catch (err) {
    console.error("[PLAY ERROR]", err);
    await sendText(
      conn,
      m.chat,
      config.message.error || "Terjadi kesalahan saat memproses lagu.",
      m,
    );
  }
};

handler.command = "play";
handler.alias = ["music", "p"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
