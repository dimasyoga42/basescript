import { AIRich } from "@ryuu-reinzz/luna-lib";

const handler = async (m, { conn }) => {
  try {
    const response = await fetch(
      "https://server.neurasama.my.id/etc/dye"
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      return m.reply("Data dye tidak ditemukan.");
    }

    const text = result.data
      .map((item, index) => {
        return `${index + 1}. ${item.name} - ${item.color}`;
      })
      .join("\n");

    const message = `*DYE*\n${text}`;

    await conn.sendMessage(
      m.chat,
      {
        text: message
      },
      {
        quoted: m
      }
    );

  } catch (err) {
    console.error(err);
    await m.reply("Gagal mengambil data dye.");
  }
};

handler.command = ["dye"];
handler.category = "Toram Info";
handler.submenu = "Toram";

export default handler;
