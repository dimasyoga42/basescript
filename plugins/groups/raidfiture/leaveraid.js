import { config, thumbnail } from "../../../config.js";
import { getUserData, saveUserData } from "../../../src/config/func.js";
import { sendFancyText, sendText } from "../../../src/config/message.js";
import path from "path";

const db = path.resolve("db", "raid.json");

const handler = async (m, { conn }) => {
  try {
    const user = m.key.participant || m.key.remoteJid;
    const data = await getUserData(db);
    const raid = data.find((item) => item.id === m.chat);

    if (!raid)
      return sendText(conn, m.chat, "Raid Not Found, use .createraid", m);

    if (!raid.party || typeof raid.party !== "object") {
      raid.party = { pt1: [], pt2: [], pt3: [], pt4: [] };
    }
    for (const key of ["pt1", "pt2", "pt3", "pt4"]) {
      if (!Array.isArray(raid.party[key])) raid.party[key] = [];
    }

    let found = false;
    for (const pt of ["pt1", "pt2", "pt3", "pt4"]) {
      const idx = raid.party[pt].findIndex((p) => p.jid === user);
      if (idx !== -1) {
        raid.party[pt].splice(idx, 1);
        found = true;
        break;
      }
    }

    if (!found)
      return sendText(conn, m.chat, "Kamu belum join party mana pun", m);

    await saveUserData(db, data);

    const list = (p) =>
      raid.party[p].length
        ? raid.party[p].map((u, i) => `${i + 1}. ${u.ign}`).join("\n")
        : "-";

    const message = `*RAID PARTY UPDATED*
Element Boss : ${raid.bos_ele || "-"}
Hadiah       : ${raid.hadiah || "-"}
Party 1 (${raid.party.pt1.length}/4)
${list("pt1")}
Party 2 (${raid.party.pt2.length}/4)
${list("pt2")}
Party 3 (${raid.party.pt3.length}/4)
${list("pt3")}
Party 4 (${raid.party.pt4.length}/4)
${list("pt4")}
> join: .join <ign> <pt1-pt4>`;

    await sendText(conn, m.chat, message, m);
  } catch (err) {
    console.error(err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["leave"];
handler.category = "Toram Raid";
handler.submenu = "Raid";
export default handler;
