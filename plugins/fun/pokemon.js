import { sendImage } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const { data } = await supa.from("pokedox").select("name, image");
    const key = Math.floor(Math.random() * data.length);
    const res = data[key];

    sendImage(
      conn,
      m.chat,
      res.image,
      `${res.name} adalah pokemon yang berhasil anda tangkap hari ini\n source: https://asia.pokemon-card.com/id/deck-build/`,
    );
  } catch (err) {}
};
handler.command = "pokemon";
handler.category = "Menu Fun";
export default handler;
