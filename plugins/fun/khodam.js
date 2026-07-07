import axios from "axios";
import { sendText } from "./../../src/config/message.js";
import * as cheerio from "cheerio";

const handler = async (m, { conn }) => {
  try {
    const url = `https://khodam.vercel.app/v2?nama=${encodeURIComponent(m.pushName)}`;

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    const resultBox = $("div.result");
    if (resultBox.length === 0) {
      return sendText(
        conn,
        m.chat,
        `Gagal ambil hasil khodam untuk "${m.pushName}".`,
        m,
      );
    }

    const paragraphs = resultBox.find("p");

    // paragraf pertama: "Khodam <nama> hari ini adalah..."
    const nama = paragraphs.eq(0).find("span").first().text().trim() || query;

    // paragraf kedua: berisi emoji + nama khodam, ambil span yang bukan emoji
    let khodam = "";
    paragraphs
      .eq(1)
      .find("span")
      .each((i, el) => {
        const t = $(el).text().trim();
        if (t && t !== "✨") khodam = t;
      });

    // quote ada di div tepat setelah div.result (posisi struktural, bukan class)
    const quote = resultBox.next("div").text().trim();

    if (!khodam) {
      return sendText(
        conn,
        m.chat,
        `Khodam untuk "${m.pushName}" tidak ditemukan.`,
        m,
      );
    }

    let teks = `Khodam *${m.pushName}* hari ini adalah...\n✨ *${khodam}* ✨`;
    if (quote) teks += `\n\n_${quote}_`;

    return sendText(conn, m.chat, teks, m);
  } catch (err) {
    return sendText(
      conn,
      m.chat,
      `terjadi kesalahan pada server\nLog Errors:\n- ${err.message}`,
      m,
    );
  }
};

handler.command = "khodam";
handler.category = "Menu Fun";
export default handler;
