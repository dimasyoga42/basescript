import axios from "axios";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const message = m.text.replace(/^\.qc\s*/i, "").trim();
    if (!message)
      return sendText(conn, m.chat, "Enter text\nExample: .qc hello world", m);

    const { data } = await axios.post(
      "https://bot.lyo.su/quote/generate",
      {
        type: "quote",
        format: "png",
        backgroundColor: "#000000",
        width: 1024,
        height: 1024,
        scale: 2,
        messages: [
          {
            entities: [],
            avatar: true,
            from: {
              id: 1,
              name: m.pushName || "User",
              photo: {
                url: "https://telegra.ph/file/24fa902ead26340f3df2c.png",
              },
            },
            text: message,
            replyMessage: {},
          },
        ],
      },
      { headers: { "Content-Type": "application/json" } },
    );

    const buffer = Buffer.from(data.result.image, "base64");

    const sticker = await new Sticker(buffer, {
      pack: config.BotName,
      author: config.OwnerName,
      type: StickerTypes.FULL,
      quality: 80,
    }).toBuffer();

    await conn.sendMessage(m.chat, { sticker }, { quoted: m });
  } catch (err) {
    console.error("[qc]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["qc"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
