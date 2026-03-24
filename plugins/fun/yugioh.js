import { sendImage } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const { data } = await supa
      .from("yugioh")
      .select("name, image, type, desc");
    const key = Math.floor(Math.random() * data.length);
    const res = data[key];

    sendImage(
      conn,
      m.chat,
      res.image,
      `${res.name} adalah kartu yang berhasil anda dapat hari ini\n\nType kartu: ${res.type}\ndeskripsi:\n${res.desc}\n source:https://ygoprodeck.com/card-database/?num=100&offset=0 `,
      m,
    );
  } catch (err) {}
};
handler.command = "yugioh";
handler.category = "Menu Fun";
export default handler;
