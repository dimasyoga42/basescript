import { config, thumbnail } from "../../../config.js";
import { getUserData, saveUserData } from "../../../src/config/func.js";
import { sendFancyText, sendText } from "../../../src/config/message.js";
import path from "path";

const db = path.resolve("db", "raid.json");

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const ign = arg[1];
    const pt = arg[2];

    if (!ign || !pt)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: config.OwnerName,
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

    if (!["pt1", "pt2", "pt3", "pt4"].includes(pt))
      return sendText(
        conn,
        m.chat,
        "Format salah gunakan .join ign pt1-pt4",
        m,
      );

    const user = m.key.participant || m.key.remoteJid;
    const data = await getUserData(db);

    // ✅ pakai isValidData konsisten, bukan raid
    const isValidData = data.find((item) => item.id === m.chat);
    if (!isValidData)
      return sendText(conn, m.chat, "Raid Not Found, use .createraid", m);

    // ✅ fix: cek object bukan array
    if (!isValidData.party || typeof isValidData.party !== "object") {
      isValidData.party = { pt1: [], pt2: [], pt3: [], pt4: [] };
    }

    // ✅ pastikan tiap pt adalah array
    for (const key of ["pt1", "pt2", "pt3", "pt4"]) {
      if (!Array.isArray(isValidData.party[key])) {
        isValidData.party[key] = [];
      }
    }

    // ✅ cek user sudah join party lain
    for (const key of ["pt1", "pt2", "pt3", "pt4"]) {
      if (isValidData.party[key].some((p) => p.jid === user)) {
        return sendText(conn, m.chat, "Kamu sudah join party lain", m);
      }
    }

    // ✅ cek party penuh
    if (isValidData.party[pt].length >= 4) {
      return sendText(conn, m.chat, `${pt} sudah penuh (4/4)`, m);
    }

    // ✅ join party
    isValidData.party[pt].push({ jid: user, ign });

    await saveUserData(db, data);

    const list = (p) =>
      isValidData.party[p].length
        ? isValidData.party[p].map((u, i) => `${i + 1}. ${u.ign}`).join("\n")
        : "-";

    const message = `*RAID PARTY UPDATED*
Element Boss : ${isValidData.bos_ele || "-"}
Hadiah       : ${isValidData.hadiah || "-"}

Party 1 (${isValidData.party.pt1.length}/4)
${list("pt1")}

Party 2 (${isValidData.party.pt2.length}/4)
${list("pt2")}

Party 3 (${isValidData.party.pt3.length}/4)
${list("pt3")}

Party 4 (${isValidData.party.pt4.length}/4)
${list("pt4")}

> join: .join <ign> <pt1-pt4>`;

    await sendText(conn, m.chat, message, m);
  } catch (err) {
    console.error(err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["join"];
handler.category = "Toram Raid";
handler.submenu = "Raid";
export default handler;
