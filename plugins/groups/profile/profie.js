import path from "path";
import fs from "fs";
import { config } from "../../../config.js";
import { getUserData } from "../../../src/config/func.js";
import { sendText } from "../../../src/config/message.js";

const db = path.resolve("db", "profil.json");

const getUserId = (m) =>
  m.key.remoteJid.endsWith("@s.whatsapp.net")
    ? m.key.remoteJid
    : m.key.participant || m.key.remoteJid;

const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group only", m);

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    const quotedParticipant =
      m.message?.extendedTextMessage?.contextInfo?.participant;

    const self = getUserId(m);
    const targetId = mention || quotedParticipant || self;
    const isSelf = targetId === self;

    const data = await getUserData(db);
    const user = data.find((u) => u.userId === targetId);

    if (!user) {
      let profileURL;

      try {
        profileURL = await conn.profilePictureUrl(targetId, "image");
      } catch {
        profileURL = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
      }

      const name = isSelf
        ? m.pushName
        : mention
          ? `@${targetId.split("@")[0]}`
          : "User";

      return await conn.sendMessage(
        m.chat,
        {
          image: { url: profileURL },
          caption: `${name} belum membuat profile.\nGunakan .setdesc | .setpp untuk menambahkan profile.`,
          mentions: mention ? [targetId] : [],
        },
        { quoted: m },
      );
    }

    const caption = `Buff: ${user.idBuff || "-"}\n\n${user.bio || "-"}`;

    if (user.profilPath && fs.existsSync(user.profilPath)) {
      return await conn.sendMessage(
        m.chat,
        {
          image: fs.readFileSync(user.profilPath),
          caption,
          ...(mention && { mentions: [targetId] }),
        },
        { quoted: m },
      );
    }

    let profileURL;

    try {
      profileURL = await conn.profilePictureUrl(targetId, "image");
    } catch {
      profileURL = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
    }

    return await conn.sendMessage(
      m.chat,
      {
        image: { url: profileURL },
        caption,
        ...(mention && { mentions: [targetId] }),
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("[profile]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["profile"];
handler.category = "Menu Sosial";
handler.submenu = "Profile";

export default handler;
