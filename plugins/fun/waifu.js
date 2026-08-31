import {
  sendImage,
  sendText,
} from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  try {
   sendImage(conn, m.chat, "https://shinraapi.cloud/api/waifu", "ini adalah waifu anda hari ini", m)
  } catch (err) {
    sendText(conn, m.chat, err, m)
 }
};

handler.command = ["waifu"];
handler.category = "Menu Fun";
handler.submenu = "Fun";

export default handler;
