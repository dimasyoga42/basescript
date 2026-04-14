import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "raidmem.json");

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.trim().split("|");
    const validIsjob = ["DPS", "TANK", "SUPPORT"];
    const name = arg[1];
    const job = arg[2];

    if (!name || !job) {
      return conn.sendMessage(m.chat, { text: "Format salah! Gunakan: .daftarraid |<name>|<job>" }, { quoted: m });
    }

    if (!validIsjob.includes(job.toUpperCase())) {
      return conn.sendMessage(m.chat, { text: "Jobs yang anda masukan tidak valid, gunakan jobs di bawah ini:\n- DPS\n- TANK\n- SUPPORT" }, { quoted: m });
    }

    const data = await getUserData(db);
    let dataValid = data.find(item => item.grubId === m.chat);

    if (!dataValid) {
      const newRaidme = {
        grubId: m.chat,
        member: [],
      };
      data.push(newRaidme);
      saveUserData(db, data);
      dataValid = newRaidme;
    }

    const memberExist = dataValid.member.find(item => item.name === name);
    if (memberExist) {
      return conn.sendMessage(m.chat, { text: `${name} sudah terdaftar sebagai ${memberExist.job}!` }, { quoted: m });
    }

    dataValid.member.push({
      name: name,
      job: job.toUpperCase(),
    });

    saveUserData(db, data);
    return conn.sendMessage(m.chat, { text: `${name} berhasil didaftarkan sebagai ${job.toUpperCase()}!` }, { quoted: m });

  } catch (err) {
    console.log(err);
  }
};

handler.command = "daftarraid";
handler.category = "Raid Menu V2";
export default handler;
