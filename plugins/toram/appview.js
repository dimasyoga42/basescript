import { config } from "../../config.js";
import { sendImage, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(/\.appview|.app/, "").trim();
    if (!name) return sendText(conn, m.chat, config.message.invalid, m);

    const { data, error } = await supa
      .from("appview")
      .select("name, image_url")
      .ilike("name", `%${name}%`);

    if (data.length === 0 || error)
      return sendText(conn, m.chat, config.message.notFound, m);

    data.map((item) => {
      sendImage(conn, m.chat, item.image_url, `${item.name}`, m);
    });
  } catch (err) {
    sendText(conn, m.chat, config.message.error, m);
  }
};
handler.command = "appview";
handler.alias = ["app"];
handler.category = "Toram Search";
export default handler;
