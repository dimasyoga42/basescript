import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PinSearch = async (conn, m, value, maxValue = 10) => {
  try {
    if (!value)
      return conn.sendMessage(
        m.chat,
        { text: "format yang anda gunakan salah, gunakan .pin any" },
        { quoted: m },
      );
    const COOKIES = {
      _auth: "1",
      csrftoken: process.env.CRS,
      _pinterest_sess: process.env.COOKIE,
    };
    const Client = axios.create({
      baseURL: "https://www.pinterest.com",
      timeout: 2000,
    });
    const buildCookieString = (CookueObj) => {
      Object.entries(CookueObj)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    };
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

      // tambahan penting
      "x-pinterest-source-url": `/search/pins/?q=${query}`,
      "x-app-version": "c7c4c3d",
      "x-pinterest-pws-handler": "www/[username].js",
    });
  } catch (err) {
    conn.sendMessage(
      m.chat,
      {
        text: "Terjadi kesalahan pada saat pencariian data, silahkan ulang beberapa saat lagi",
      },
      { quoted: m },
    );
  }
};
