import os from "os";
import { sendFancyText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
const handler = async (m, { conn }) => {
  try {
    const dataset = {
      Distro: os.platform(),
      Arsitektur: os.arch(),
      Cpu: os.cpus().length,
      Tram: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
      Fram: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
      Uptime: (os.uptime() / 3600).toFixed(2),
    };
    const mtex =
      `Distro: ${dataset.Distro}\nArsitektur: ${dataset.Arsitektur}\nCPU: ${dataset.Cpu}\nTotal Ram: ${dataset.Tram}\nFree Ram: ${dataset.Fram}\nUptime: ${dataset.Uptime}`.trim();
    sendFancyText(conn, m.chat, {
      title: "Neura Sama",
      body: config.OwnerName,
      thumbnail: thumbnail,
      text: mtex,
      quoted: m,
    });
  } catch (err) {}
};

handler.command = "server";
handler.category = "Menu Bot";
handler.submenu = "Bot";
export default handler;
