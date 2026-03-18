import { sendFancyText, sendText } from "../../src/config/message.js";

const handler = (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const query = m.text.replace(".cek", "").trim();
    if (!query)
      return sendFancyText(conn, m.chat, {
        title: "Neura Sama",
        body: "waah gagal nih",
        text: "format salah gunakan .cek ganteng",
        thumbnail:
          "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
        quoted: m,
      });
    const random = Math.floor(Math.random() * 100) + 1;

    sendText(conn, m.chat, `${random}% ${query}`, m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: "Neura Sama",
      body: "waah gagal nih",
      text: "coba di ulang lagi",
      thumbnail:
        "https://i.pinimg.com/736x/f5/37/29/f5372928b53a4f87fc59ef26503c78e3.jpg",
      quoted: m,
    });
  }
};
handler.command = ["cek"];
handler.category = "Menu Fun";
handler.submenu = "Fun";
export default handler;
