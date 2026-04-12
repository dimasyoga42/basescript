import axios from "axios";

const baseUrl = "https://api.neurawiki.my.id";

const header = async (m, { conn }) => {
  try {
    const name = m.text.replace(/\.pixiv/, "").trim();

    if (!name)
      return conn.sendMessage(
        m.chat,
        {
          text: "masukan yang anda cari setelah .pixiv\nContoh: .pixiv naruto",
        },
        { quoted: m },
      );

    const data = await axios.get(`${baseUrl}/etc/pixiv?query=${name}`);
    const res = data.data;

    if (!res || res.length === 0)
      return conn.sendMessage(
        m.chat,
        { text: `Hasil untuk *${name}* tidak ditemukan` },
        { quoted: m },
      );

    const images = res.data.slice(0, 20).map((item, i) => ({
      image: { url: `${baseUrl}${item.proxy}` },
      caption: i === 0 ? `🖼️ *${name}*\nPixiv` : "", // ✅ fix: 'query' → 'name'
    }));

    await conn.sendAlbum(m.chat, images, { quoted: m });
  } catch (err) {
    console.error("[pixiv] error:", err.message); // ✅ fix: catch tidak kosong
    conn.sendMessage(
      m.chat,
      { text: `Terjadi kesalahan: ${err.message}` },
      { quoted: m },
    );
  }
};

header.command = "pixiv";
header.category = "Menu Tools";
export default header;
