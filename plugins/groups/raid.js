import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "raidmem.json");

const handler = async (m, { conn }) => {
  try {
    const text = m.text || "";
    const arg = text.split("|").map(v => v.trim());

    const validIsjob = ["DPS", "TANK", "SUPPORT"];
    const name = arg[1];
    const job = arg[2];

    if (!name || !job) {
      return conn.sendMessage(
        m.chat,
        { text: "Format salah! Gunakan: .daftarraid |<name>|<job>" },
        { quoted: m }
      );
    }

    const jobUpper = job.toUpperCase();

    if (!validIsjob.includes(jobUpper)) {
      return conn.sendMessage(
        m.chat,
        {
          text:
            "Jobs tidak valid!\nGunakan:\n- DPS\n- TANK\n- SUPPORT",
        },
        { quoted: m }
      );
    }

    const data = (await getUserData(db)) || [];

    let dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid) {
      dataValid = {
        grubId: m.chat,
        member: [],
      };
      data.push(dataValid);
    }

    const memberExist = dataValid.member.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (memberExist) {
      return conn.sendMessage(
        m.chat,
        {
          text: `${name} sudah terdaftar sebagai ${memberExist.job}!`,
        },
        { quoted: m }
      );
    }

    dataValid.member.push({
      name,
      job: jobUpper,
    });

    await saveUserData(db, data);

    return conn.sendMessage(
      m.chat,
      {
        text: `${name} berhasil didaftarkan sebagai ${jobUpper}!`,
      },
      { quoted: m }
    );
  } catch (err) {
    console.error("DAFTAR RAID ERROR:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat mendaftar raid." },
      { quoted: m }
    );
  }
};

handler.command = "daftarraid";
handler.category = "Raid Menu V2";

export default handler;
