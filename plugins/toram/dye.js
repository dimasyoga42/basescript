import { sendImage } from "../../src/config/message.js";

const handler = (m, { conn }) => {
  try {
    sendImage(
      conn,
      m.chat,
      "https://raw.githubusercontent.com/dimasyoga42/dataset/refs/heads/main/dye_table.png",
      "Dye Weapon Prediction",
      m,
    );
  } catch (err) {}
};

handler.command = ["dye"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
