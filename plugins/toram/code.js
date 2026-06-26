import axios from "axios";
import { sendImage, sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const { data } = await axios.get(
      "https://neurapi.mochinime.cyou/api/etc/code/578244723349782538?limit=1",
    );

    const message = data.data[0];

    if (!message?.attachments?.length) {
      return m.reply("Tidak ada gambar.");
    }

    await sendImage(
      conn,
      m.chat,
      message.attachments[0].url,
      message.content,
      m,
    );
  } catch (err) {
    console.error(err);
    sendText(conn, m.chat, "Terjadi kesalahan.", m);
  }
};
handler.command = "code";
handler.category = "Menu Toram";
export default handler;
