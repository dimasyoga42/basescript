import axios from "axios";
import { config } from "../../config.js";

const getProfilePicture = async (conn, jid) => {
  try {
    return await conn.profilePictureUrl(jid, "image");
  } catch {
    return "https://ui-avatars.com/api/?name=User&background=random";
  }
};

const handler = async (m, { conn }) => {
  try {
    const { action, participants, id } = m;
    if (!action || !participants) return;

    const groupMeta = await conn.groupMetadata(id);
    const groupName = groupMeta.subject;
    const totalMember = groupMeta.participants.length;

    for (const participant of participants) {
      // ✅ pastikan jid adalah string
      const jid =
        typeof participant === "string"
          ? participant
          : participant.id || participant.jid || String(participant);
      const name = jid.split("@")[0];
      const avatar = await getProfilePicture(conn, jid);

      if (action === "add") {
        const url = `https://api.siputzx.my.id/api/canvas/welcomev5?username=${encodeURIComponent(name)}&guildName=${encodeURIComponent(groupName)}&memberCount=${totalMember}&avatar=${encodeURIComponent(avatar)}&background=${encodeURIComponent(config.welcomeBg || "")}&quality=90`;

        const res = await axios.get(url, { responseType: "arraybuffer" });

        await conn.sendMessage(id, {
          image: Buffer.from(res.data),
          caption: `Selamat datang @${name} di *${groupName}*!\nMember ke-${totalMember}`,
          mentions: [jid],
        });
      }

      if (action === "remove") {
        const url = `https://api.siputzx.my.id/api/canvas/goodbyev4?avatar=${encodeURIComponent(avatar)}&background=${encodeURIComponent(config.goodbyeBg || "")}&title=Goodbye&description=${encodeURIComponent(`${name} telah meninggalkan ${groupName}`)}&border=%232a2e35&avatarBorder=%232a2e35&overlayOpacity=0.3`;

        const res = await axios.get(url, { responseType: "arraybuffer" });

        await conn.sendMessage(id, {
          image: Buffer.from(res.data),
          caption: `Sampai jumpa @${name}!\nMember: ${totalMember}`,
          mentions: [jid],
        });
      }
    }
  } catch (err) {
    console.error("[welcome]", err.message);
  }
};

handler.on = "group_participants_update";
handler.category = "Grup";
handler.submenu = "Welcome";
export default handler;
