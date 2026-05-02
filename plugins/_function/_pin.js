import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const PinSearchMenu = async (conn, m, value) => {
  try {
    if (!value)
      return conn.sendMessage(
        m.chat,
        { text: "Format yang anda gunakan salah, gunakan .pin <keyword>" },
        { quoted: m },
      );

    return await conn.sendButton(m.chat, {
      text: `Keyword: ${value}\n\nPilih jumlah gambar yang ingin diunduh:`,
      footer: config.OwnerName,
      buttons: [10, 20, 30, 40, 50].map((jumlah) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: `${jumlah} Gambar`,
          id: `.pin ${value} ${jumlah}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Pilih Jumlah Gambar",
    });
  } catch (err) {
    console.error(err.message);
    conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat menampilkan menu, silahkan coba lagi." },
      { quoted: m },
    );
  }
};

export const PinSearch = async (conn, m, value, maxValue = 10) => {
  try {
    if (!value)
      return conn.sendMessage(
        m.chat,
        { text: "Format yang anda gunakan salah, gunakan .pin <keyword>" },
        { quoted: m },
      );

    const COOKIES = {
      _auth: "1",
      csrftoken: process.env.CRS,
      _pinterest_sess: process.env.COOKIE,
    };

    const Client = axios.create({
      baseURL: "https://www.pinterest.com",
      timeout: 20000,
    });

    const buildCookieString = (cookieObj) =>
      Object.entries(cookieObj)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

    const buildHeaders = (query = value) => ({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Cookie: buildCookieString(COOKIES),
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": COOKIES.csrftoken,
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: `https://www.pinterest.com/search/pins/?q=${query}`,
      Origin: "https://www.pinterest.com",
      "x-pinterest-source-url": `/search/pins/?q=${query}`,
      "x-app-version": "c7c4c3d",
      "x-pinterest-pws-handler": "www/[username].js",
    });

    await conn.sendMessage(
      m.chat,
      { text: `Mencari ${maxValue} gambar untuk keyword: ${value}...` },
      { quoted: m },
    );

    const { data } = await Client.get("/resource/BaseSearchResource/get/", {
      params: {
        source_url: `/search/pins/?q=${value}`,
        data: JSON.stringify({
          options: {
            query: value,
            scope: "pins",
            page_size: maxValue,
          },
          context: {},
        }),
      },
      headers: buildHeaders(value),
    });

    const results = data?.resource_response?.data?.results || [];

    if (results.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: `Tidak ada hasil untuk pencarian: ${value}` },
        { quoted: m },
      );
    }

    const pins = results
      .filter((pin) => pin?.images?.orig?.url)
      .slice(0, maxValue);

    if (pins.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: `Tidak ada gambar yang valid untuk pencarian: ${value}` },
        { quoted: m },
      );
    }

    await conn.sendMessage(
      m.chat,
      { text: `Ditemukan ${pins.length} gambar, mengirim...` },
      { quoted: m },
    );

    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < pins.length; i += chunkSize) {
      chunks.push(pins.slice(i, i + chunkSize));
    }

    const sendChunk = async (index) => {
      if (index >= chunks.length) return;

      const chunk = chunks[index];

      try {
        const images = chunk.map((pin, i) => ({
          image: { url: pin.images.orig.url },
          caption: index === 0 && i === 0 ? `${value}\nPinterest` : "",
        }));
        console.log(`Mengirim album ${index + 1}/${chunks.length}`);
        await conn.sendAlbum(m.chat, images, { quoted: m });
      } catch (albumErr) {
        console.log(
          `sendAlbum gagal, fallback satu per satu: ${albumErr.message}`,
        );
        for (const pin of chunk) {
          await conn.sendMessage(
            m.chat,
            { image: { url: pin.images.orig.url }, caption: "" },
            { quoted: m },
          );
          await delay(1000);
        }
      }

      await delay(5000);
      await sendChunk(index + 1);
    };

    await sendChunk(0);

    await conn.sendMessage(
      m.chat,
      { text: `Selesai! ${pins.length} gambar berhasil dikirim.` },
      { quoted: m },
    );
  } catch (err) {
    console.error(err.message);
    conn.sendMessage(
      m.chat,
      {
        text: "Terjadi kesalahan saat pencarian data, silahkan ulang beberapa saat lagi.",
      },
      { quoted: m },
    );
  }
};
