import axios from "axios";
import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const getProfilePicture = async (conn, jid) => {
  try {
    return await conn.profilePictureUrl(jid, "image");
  } catch {
    return "https://ui-avatars.com/api/?name=User&background=random";
  }
};

const getName = async (conn, jid) => {
  try {
    const contact = await conn.getPNFromLid(jid);
    return contact.split("@")[0] || jid.split("@")[0];
  } catch {
    return jid.split("@")[0];
  }
};

const handler = async (m, { conn }) => {
  try {
    const { id, participants, action } = m;
    if (!id || !participants) return;

    const meta = await conn.groupMetadata(id);
    const groupName = meta.subject;
    const memberCount = meta.participants.length;
    const groupDesc = meta.desc?.toString() || "Tidak ada deskripsi";

    const { data } = await supa
      .from("wellcome")
      .select("message")
      .eq("id_grub", id)
      .maybeSingle();

    for (const participant of participants) {
      const jid =
        typeof participant === "string"
          ? participant
          : participant.id || participant.jid;

      const number = jid.split("@")[0];
      const username = await getName(conn, jid);
      const avatar = await getProfilePicture(conn, jid);

      // ================= WELCOME =================
      if (action === "add") {
        const rawText = data?.message || "@user selamat datang di @group";

        const caption = rawText
          .replace(/@user/g, `@${number}`)
          .replace(/@nama/g, username)
          .replace(/@group/g, groupName)
          .replace(/@count/g, memberCount.toString())
          .replace(/@desc/g, groupDesc);

        const url = `https://api.siputzx.my.id/api/canvas/welcomev5?username=${encodeURIComponent(username)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(avatar)}&background=${encodeURIComponent(config.welcomeBg || "")}&quality=90`;

        let image;
        try {
          const res = await axios.get(url, {
            responseType: "arraybuffer",
          });
          image = Buffer.from(res.data);
        } catch {
          image = null;
        }

        if (image) {
          await conn.sendMessage(id, {
            image,
            caption,
            mentions: [jid],
          });
        } else {
          await conn.sendMessage(id, {
            text: caption,
            mentions: [jid],
          });
        }
      }

      // ================= GOODBYE =================
      if (action === "remove") {
        const caption = `Selamat tinggal @${number} 👋`;

        const url = `https://api.siputzx.my.id/api/canvas/goodbyev4?avatar=${encodeURIComponent(avatar)}&background=${encodeURIComponent(config.goodbyeBg || "")}&title=Goodbye&description=${encodeURIComponent(`${username} keluar dari ${groupName}`)}&border=%232a2e35&avatarBorder=%232a2e35&overlayOpacity=0.3`;

        let image;
        try {
          const res = await axios.get(url, {
            responseType: "arraybuffer",
          });
          image = Buffer.from(res.data);
        } catch {
          image = null;
        }

        if (image) {
          await conn.sendMessage(id, {
            image,
            caption,
            mentions: [jid],
          });
        } else {
          await conn.sendMessage(id, {
            text: caption,
            mentions: [jid],
          });
        }
      }
    }
  } catch (err) {
    console.error("WELCOME HANDLER ERROR:", err);
  }
};

handler.on = "group_participants_update";
handler.category = "Grup";

export default handler;
