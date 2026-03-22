import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
import axios from "axios";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(".emot", "").trim();
    if (!name)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .emot name",
        thumbnail: thumbnail,
        text: config.message.invalid,
        quoted: m,
      });
    const { data } = await supa
      .from("emot")
      .select("name, url")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (!data)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    const res = await axios.get(data.url, {
      responseType: "arraybuffer",
      timeout: 15000,
    })
    const buffer = Buffer.from(res.data);
    const contentType = res.headers["content-type"] || "";
    const isGif = contentType.includes("gif") || url.toLowerCase().endsWith(".gif");


    if (isGif) {
      await conn.sendMessage(
        chatId,
        {
          video: buffer,
          mimetype: "image/gif",
          gifPlayback: true,
          caption: data.name,
        },
        { quoted }
      );
    } else {
      await conn.sendMessage(
        chatId,
        {
          image: buffer,
          caption: data.name,
        },
        { quoted }
      );
    }
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["emot"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
