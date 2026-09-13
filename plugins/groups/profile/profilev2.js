
import { sendImage, sendText } from "../../../src/config/message.js"
import { supa } from "../../../src/config/supa.js"

const getUserId = (m) => {
  const remoteJid = m.key?.remoteJid

  if (remoteJid?.endsWith("@s.whatsapp.net"))
    return remoteJid

  return m.key?.participantAlt || m.key?.participant || remoteJid
}

const handler = async (m, { conn }) => {
  try {
    if (!m.chat?.endsWith("@g.us"))
      return sendText(conn, m.chat, "Group only", m)

    const contextInfo =
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.imageMessage?.contextInfo ||
      m.message?.videoMessage?.contextInfo

    const mention = contextInfo?.mentionedJid?.[0]
    const quotedParticipant =
      contextInfo?.participantAlt ||
      contextInfo?.participant

    const self = getUserId(m)
    const targetId = mention || quotedParticipant || self
    const isSelf = targetId === self

    const { data, error } = await supa
      .from("profile")
      .select("user_id, bio, profile_path")
      .eq("user_id", targetId).single()

    if (error)
      throw error

    if (!data) {
      let profileUrl

      try {
        profileUrl = await conn.profilePictureUrl(targetId, "image")
      } catch {
        profileUrl = "https://telegra.ph/file/24fa902ead26340f3df2c.png"
      }

      const name = isSelf
        ? m.pushName || "User"
        : mention
          ? `@${targetId.split("@")[0]} `
          : "User"

      return await conn.sendMessage(
        m.chat,
        {
          image: { url: profileUrl },
          caption: `${name} belum membuat profile.\nGunakan.setdesc | .setpp untuk menambahkan profile.`,
          mentions: mention ? [targetId] : [],
        },
        { quoted: m }
      )
    }

    let profilePath = data.profile_path

    if (!profilePath) {
      try {
        profilePath = await conn.profilePictureUrl(targetId, "image")
      } catch {
        profilePath = "https://telegra.ph/file/24fa902ead26340f3df2c.png"
      }
    }

    return sendImage(
      conn,
      m.chat,
      profilePath,
      data.bio || "Belum ada bio.",
      m
    )
  } catch (err) {
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
