import axios from "axios";
import { sendText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
    const data = await axios.get(
      `https://api.neoxr.eu/api/khodam?apikey=${process.env.NOXER}`,
    );
    const result = data.data;
    console.log(result);
    sendText(conn, m.chat, `${result.data.name} ${result.data.meaning}`, m);
  } catch (err) {}
};

handler.command = ["khodam"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
