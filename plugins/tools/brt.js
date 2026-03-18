import { Sticker } from "wa-sticker-formatter";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";

const handler = async (m, { conn }) => {
  try {
    const cx = m.text.replace(/^\.(brat)\s*/i, "").trim();

    if (!cx)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `use: .brat owner ganteng`,
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });

    const url = `https://api.deline.web.id/maker/brat?text=${encodeURIComponent(cx)}`;

    const sticker = new Sticker(url, {
      pack: config.BotName,
      author: config.OwnerName,
      type: "full",
      quality: 80,
    });

    const buffer = await sticker.toBuffer();
    await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
  } catch (err) {
    console.error(err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["brat"];
handler.category = "Menu Tools";
handler.submenu = "Maker";
export default handler;
