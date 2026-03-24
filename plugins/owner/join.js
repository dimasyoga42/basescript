import { isOwner } from "../_function/_ban.js";

const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;

const handler = async (m, { conn }) => {
  try {
    if (!isOwner(conn, m)) return;

    const text = m.text.trim();
    const match = text.match(linkRegex);
    if (!match)
      return await conn.sendMessage(
        m.chat,
        { text: "Masukkan link group WhatsApp yang valid!" },
        { quoted: m },
      );

    const code = match[1];
    const response = await conn.groupAcceptInvite(code);

    console.log("joined to:", response);

    await conn.sendMessage(
      m.chat,
      { text: "Berhasil join ke group!" },
      { quoted: m },
    );
  } catch (err) {
    console.error("[join-group]", err);

    await conn.sendMessage(
      m.chat,
      { text: "Gagal join group atau link tidak valid!" },
      { quoted: m },
    );
  }
};

handler.command = ["join"];
handler.category = "Menu Owner";

export default handler;
