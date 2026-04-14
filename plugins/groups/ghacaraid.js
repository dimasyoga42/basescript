import path from "path";
import { getUserData } from "../../src/config/func.js";

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
    const args = m.text.split(" ");
    const tankPerParty = parseInt(args[1]) || 1;

    if (tankPerParty < 0 || tankPerParty > 4) {
      return conn.sendMessage(
        m.chat,
        { text: "Jumlah tank per party harus antara 0 - 4" },
        { quoted: m }
      );
    }

    const data = await getUserData(db);
    const dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid || dataValid.member.length < 4) {
      return conn.sendMessage(
        m.chat,
        { text: "Minimal 4 member untuk gacha party." },
        { quoted: m }
      );
    }

    let members = shuffle([...dataValid.member]);

    let tanks = members.filter((m) => m.job === "TANK");
    let supports = members.filter((m) => m.job === "SUPPORT");
    let dps = members.filter((m) => m.job === "DPS");

    const parties = [];
    const maxParty = 4;

    for (let i = 0; i < maxParty; i++) {
      if (members.length === 0) break;

      const party = [];

      // 🔥 AMBIL TANK SESUAI INPUT
      for (let t = 0; t < tankPerParty; t++) {
        if (tanks.length > 0 && party.length < 4) {
          party.push(tanks.shift());
        }
      }

      // 🔥 1 SUPPORT (kalau ada)
      if (supports.length > 0 && party.length < 4) {
        party.push(supports.shift());
      }

      // 🔥 ISI SISANYA
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
    let text = `*HASIL GACHA PARTY*\n`;
    text += `Tank per party: ${tankPerParty}\n\n`;

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
