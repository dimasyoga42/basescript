import axios from "axios";
import { sendText } from "../../src/config/message.js";
import { config } from "../../config.js";
import * as cheerio from "cheerio";

const handler = async (m, { conn }) => {
  try {
    const query = m.text.replace(/^\.pin\s*/i, "").trim();
    if (!query)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}\nuse .pin any`,
        m,
      );

    await sendText(conn, m.chat, "Mencari...", m);

    const res = await axios.get(
      `https://id.pinterest.com/search/pins/?autologin=true&q=` + query,
      {
        headers: {
          "cookie": "_auth=1; _b=\"AVna7S1p7l1C5I9u0+nR3YzijpvXOPc6d09SyCzO+DcwpersQH36SmGiYfymBKhZcGg=\"; _pinterest_sess=TWc9PSZHamJOZ0JobUFiSEpSN3Z4a2NsMk9wZ3gxL1NSc2k2NkFLaUw5bVY1cXR5alZHR0gxY2h2MVZDZlNQalNpUUJFRVR5L3NlYy9JZkthekp3bHo5bXFuaFZzVHJFMnkrR3lTbm56U3YvQXBBTW96VUgzVUhuK1Z4VURGKzczUi9hNHdDeTJ5Y2pBTmxhc2owZ2hkSGlDemtUSnYvVXh5dDNkaDN3TjZCTk8ycTdHRHVsOFg2b2NQWCtpOWxqeDNjNkk3cS85MkhhSklSb0hwTnZvZVFyZmJEUllwbG9UVnpCYVNTRzZxOXNJcmduOVc4aURtM3NtRFo3STlmWjJvSjlWTU5ITzg0VUg1NGhOTEZzME9SNFNhVWJRWjRJK3pGMFA0Q3UvcHBnWHdaYXZpa2FUNkx6Z3RNQjEzTFJEOHZoaHRvazc1c1UrYlRuUmdKcDg3ZEY0cjNtZlBLRTRBZjNYK0lPTXZJTzQ5dU8ybDdVS015bWJKT0tjTWYyRlBzclpiamdsNmtpeUZnRjlwVGJXUmdOMXdTUkFHRWloVjBMR0JlTE5YcmhxVHdoNzFHbDZ0YmFHZ1VLQXU1QnpkM1FqUTNMTnhYb3VKeDVGbnhNSkdkNXFSMXQybjRGL3pyZXRLR0ZTc0xHZ0JvbTJCNnAzQzE0cW1WTndIK0trY05HV1gxS09NRktadnFCSDR2YzBoWmRiUGZiWXFQNjcwWmZhaDZQRm1UbzNxc21pV1p5WDlabm1UWGQzanc1SGlrZXB1bDVDWXQvUis3elN2SVFDbm1DSVE5Z0d4YW1sa2hsSkZJb1h0MTFpck5BdDR0d0lZOW1Pa2RDVzNySWpXWmUwOUFhQmFSVUpaOFQ3WlhOQldNMkExeDIvMjZHeXdnNjdMYWdiQUhUSEFBUlhUVTdBMThRRmh1ekJMYWZ2YTJkNlg0cmFCdnU2WEpwcXlPOVZYcGNhNkZDd051S3lGZmo0eHV0ZE42NW8xRm5aRWpoQnNKNnNlSGFad1MzOHNkdWtER0xQTFN5Z3lmRERsZnZWWE5CZEJneVRlMDd2VmNPMjloK0g5eCswZUVJTS9CRkFweHc5RUh6K1JocGN6clc1JmZtL3JhRE1sc0NMTFlpMVErRGtPcllvTGdldz0=; _ir=0"
        }
      }
    );

    const $ = cheerio.load(res.data);
    const result = [];
    const hasil = [];

    $('div > a').each((i, b) => {
      const link = $(b).find('img').attr('src');
      result.push(link);
    });

    result.forEach(v => {
      if (v === undefined) return;
      hasil.push(v.replace(/236/g, '736'));
    });

    hasil.shift();

    if (hasil.length === 0)
      return sendText(conn, m.chat, "Gambar tidak ditemukan, coba kata kunci lain.", m);

    const images = hasil.slice(0, 5).map((imgUrl, i) => ({
      image: { url: imgUrl },
      caption: i === 0 ? `🖼️ *${query}*\nPinterest` : "",
    }));

    await conn.sendAlbum(m.chat, images, { quoted: m });
  } catch (err) {
    console.error("[pinterest]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["pin"];
handler.category = "Menu Tools";
handler.submenu = "Tools";
export default handler;
