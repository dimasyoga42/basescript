import axios from "axios";
import { sendText, sendImage } from "./../../src/config/message.js";
import * as cheerio from "cheerio";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/\.artinama/i, "").trim();
    if (!query) return sendText(conn, m.chat, "masukan nama setelah .artinama\ncontoh: .artinama neura", m);

    const url = `https://primbon.com/arti_nama.php?nama1=${encodeURIComponent(query)}&proses=+Submit%21+`;

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);

    const body = $("#body").clone();
    body.find("script, style, ins, iframe, .insert_ads").remove();

    let bodyHtml = body.html() || "";

    const cutIndex = bodyHtml.indexOf("<table");
    if (cutIndex !== -1) bodyHtml = bodyHtml.slice(0, cutIndex);

    const $$ = cheerio.load(bodyHtml);
    $$("h1").remove();

    const hasil = $$.text().replace(/\s+/g, " ").trim();

    if (!hasil || !hasil.toLowerCase().includes("memiliki arti")) {
      return sendText(conn, m.chat, `Arti nama untuk "${query}" tidak ditemukan.`, m);
    }

    return sendText(conn, m.chat, `*ARTI NAMA*\n\n${hasil}`, m);
  } catch (err) {
    return sendText(
      conn,
      m.chat,
      `terjadi kesalahan pada server\nLog Errors:\n- ${err.message}`,
      m
    );
  }
};

handler.command = "artinama";
handler.category = "Menu Fun"

export default handler;
