import axios from "axios";
import { sendFancyText } from "../../src/config/message.js";

const handler = async (m, { conn }) => {
  const res = await axios.get(
    "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
  );
  const data = res.data.Infogempa;
  const messagetxt = `
  *Informasi Gempa Terbaru By BMKG*\ntanggl: ${data.gempa.Tanggal}\njam: ${data.gempa.Jam}\ncoordinat:${data.gempa.Coordinates}\nlintang: ${data.gempa.Lintang}\nbujur: ${data.gempa.Bujur}\nmagnitude: ${data.gempa.Magnitude}\nkedalaman: ${data.gempa.Kedalaman}\nwilayah: ${data.gempa.Wilayah}\npotensi: ${data.gempa.Potensi}
      `.trim();
  sendFancyText(conn, m.chat, {
    title: "Neura Sama",
    body: "Gempa realtime info",
    thumbnail: `https://static.bmkg.go.id/${data.gempa.Shakemap}`,
    text: messagetxt,
    msg: m,
  });
};

handler.command = ["gempa"];
handler.category = "Menu Info";
handler.submenu = "Info";
export default handler;
