import { config, thumbnail } from "../../config.js";
import { sendImage, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(/\.appview|\.app/, "").trim();
    if (!name) return sendText(conn, m.chat, config.message.invalid, m);

    const { data, error } = await supa
      .from("appview")
      .select("name, image_url")
      .ilike("name", `%${name}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    if (data.length === 1) {
      return sendImage(conn, m.chat, data[0].image_url, data[0].name, m);
    }

    await conn.sendButton(m.chat, {
      image: thumbnail,
      caption: "Pilih Appview yang tersedia",
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.appview ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "menu Appview",
    });
  } catch (err) {
    sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = "appview";
handler.alias = ["app"];
handler.category = "Toram Search";
export default handler;
