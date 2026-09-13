import { sendImage, sendText } from "../../../src/config/message.js"
import { supa } from "../../../src/config/supa.js"

const getUserId = (m) => {
  const remoteJid = m.key?.remoteJid

  if (remoteJid?.endsWith("@s.whatsapp.net"))
    return remoteJid

  return m.key?.participantAlt || m.key?.participant || remoteJid
}

const DEFAULT_PP = "https://telegra.ph/file/24fa902ead26340f3df2c.png"

const getProfilePicture = async (conn, jid) => {
  try {
    return await conn.profilePictureUrl(jid, "image")
  } catch {
    return DEFAULT_PP
  }
}

const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group only", m)

    const contextInfo =
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.imageMessage?.contextInfo ||
      m.message?.videoMessage?.contextInfo

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    const quotedParticipant =
      m.message?.extendedTextMessage?.contextInfo?.participant;

    const self = getUserId(m);
    const targetId = mention || quotedParticipant || self;
    const isSelf = targetId === self;

    const displayName = isSelf
      ? (m.pushName || "User")
      : `@${targetId.split("@")[0]}`

    const mentions = isOther ? [targetId] : []

    const { data, error } = await supa
      .from("profile")
      .select("user_id, bio, profile_path")
      .eq("user_id", `${targetId}`)
    console.log(data, targetId)
    if (error) throw error

    if (!data) {
      const profileUrl = await getProfilePicture(conn, targetId)

      return await conn.sendMessage(
        m.chat,
        {
          image: { url: profileUrl },
          caption: `${displayName} belum membuat profile.\nGunakan .setdesc | .setpp untuk menambahkan profile.`,
          mentions,
        },
        { quoted: m }
      )
    }

    const profilePath = data.profile_path || (await getProfilePicture(conn, targetId))

    return sendImage(
      conn,
      m.chat,
      profilePath,
      `${displayName}\n${data.bio || "Belum ada bio."}`,
      m,
      mentions
    )
  } catch (err) {
    console.error("[profile handler]", err)
    return sendText(
      conn,
      m.chat,
      err?.message || "Terjadi kesalahan saat mengambil profile.",
      m
    )
  }
}

handler.command = "profile"
handler.alias = ["profil", "myprofil"]
handler.category = "Menu Sosial"

export default handler
