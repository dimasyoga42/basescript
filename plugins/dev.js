import { sendFancyText } from "../src/config/message.js";

const handler = async (m, { conn }) => {
  const msg = `
    *Informasi Neura Sama*
Version: 1.2B
Devloper: Dimasyoga
Status: Bot Premium
Engine: Bailyes

    `.trim();
  await sendFancyText(conn, m.chat, {
    title: "Neura Sama",
    body: "aku selalu ada",
    thumbnail:
      "https://i.pinimg.com/1200x/5f/0e/1b/5f0e1ba67378d5a770f60d9a689f0f31.jpg",
    text: msg,
    msg: m,
  });
};

handler.command = ["dev"];
handler.category = "Menu Bot";
handler.submenu = "General";

export default handler;
