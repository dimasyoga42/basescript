import path from "path";
import { getUserData } from "../../src/config/func.js";

const db = path.resolve("db", "raidmem.json");

const handler = async (m, { conn }) => {
  try {
    const data = await getUserData(db);

    const dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid || dataValid.member.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "Belum ada member raid di grup ini." },
        { quoted: m }
      );
    }

    const roleCount = {
      DPS: 0,
      TANK: 0,
      SUPPORT: 0,
    };

    let text = `*LIST RAID MEMBER*\n`;

    dataValid.member.forEach((member, index) => {
      roleCount[member.job] = (roleCount[member.job] || 0) + 1;

      text += `${index + 1}. ${member.name} — ${member.job}\n`;
    });

    text += `\n*TOTAL*\n`;
    text += `DPS: ${roleCount.DPS}\n`;
    text += `TANK: ${roleCount.TANK}\n`;
    text += `SUPPORT: ${roleCount.SUPPORT}\n`;
    text += `\nTotal Member: ${dataValid.member.length}`;

    return conn.sendMessage(
      m.chat,
      { text },
      { quoted: m }
    );
  } catch (err) {
    console.error("LIST RAID ERROR:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat mengambil data raid." },
      { quoted: m }
    );
  }
};

handler.command = "raidmem";
handler.category = "Menu Raid";

export default handler;
