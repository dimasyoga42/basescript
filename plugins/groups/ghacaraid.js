import path from "path";
import { getUserData } from "../../src/config/func.js";
import { isAdmin } from "../_function/_admin.js";

const db = path.resolve("db", "raidmem.json");

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const data =  getUserData(db);
    const dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid || dataValid.member.length < 4) {
      return conn.sendMessage(
        m.chat,
        { text: "Minimal 4 member untuk gacha party." },
        { quoted: m }
      );
    }

    let members = [...dataValid.member];

    // Shuffle biar random
    members = shuffle(members);

    const tanks = members.filter((m) => m.job === "TANK");
    const supports = members.filter((m) => m.job === "SUPPORT");
    const dps = members.filter((m) => m.job === "DPS");

    const parties = [];
    const maxParty = 4;

    for (let i = 0; i < maxParty; i++) {
      if (
        tanks.length === 0 &&
        supports.length === 0 &&
        dps.length === 0
      )
        break;

      const party = [];

      // PRIORITAS: TANK
      if (tanks.length > 0) {
        party.push(tanks.shift());
      }

      // PRIORITAS: SUPPORT
      if (supports.length > 0) {
        party.push(supports.shift());
      }

      // ISI SISA SLOT
      while (party.length < 4) {
        if (dps.length > 0) {
          party.push(dps.shift());
        } else if (supports.length > 0) {
          party.push(supports.shift());
        } else if (tanks.length > 0) {
          party.push(tanks.shift());
        } else {
          break;
        }
      }

      if (party.length > 0) parties.push(party);
    }

    // FORMAT OUTPUT
    let text = `*PARTY TELAH DI TENTUKAN*\n\n`;

    parties.forEach((party, i) => {
      text += `*PARTY ${i + 1}*\n`;
      party.forEach((p, idx) => {
        text += `${idx + 1}. ${p.name} — ${p.job}\n`;
      });
      text += `\n`;
    });

    return conn.sendMessage(
      m.chat,
      { text },
      { quoted: m }
    );
  } catch (err) {
    console.error("GACHA RAID ERROR:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat gacha party." },
      { quoted: m }
    );
  }
};

handler.command = "gacharaid";
handler.category = "Raid Menu V2";

export default handler;
