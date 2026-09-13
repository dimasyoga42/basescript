import { sendImage, sendText } from "../../../src/config/message.js"
import { supa } from "../../../src/config/supa.js";



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
    const { data, error } = await supa.from("profile").select("user_id, bio, profile_path").eq("user_id", targetId)
    if (error || !data) {
      let profileUrl

      if (!data) {
        try {
          profileUrl = await conn.profilePictureUrl(targetId, "image");
        } catch (error) {
          profileUrl = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
        }
      }
      const name = isSelf
        ? m.pushName
        : mention
          ? `@${targetId.split("@")[0]}`
          : "User";
      return await conn.sendMessage(m.chat, {
        image: { url: profileUrl },
        caption: `${name} belum membuat profile.\nGunakan .setdesc | .setpp untuk menambahkan profile.`,
        mentions: mention ? [targetId] : [],
      }, { quoted: m })
    }
    sendImage(conn, m.chat, data[0].profile_path, data[0].bio, m)
  } catch (err) {
    sendText(conn, m.chat, err.message, m)
  }
}

handler.command = "profile"
handler.alias = ["profil", "myprofil"]
handler.category = "Menu Sosial"
export default handler
