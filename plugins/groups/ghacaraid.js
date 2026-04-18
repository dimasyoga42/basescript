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

    const args = m.text.split(" ");
    const totalTank = parseInt(args[1]) || 0;

    if (totalTank < 0) {
      return conn.sendMessage(
        m.chat,
        { text: "Jumlah tank tidak valid" },
        { quoted: m },
      );
    }

    const data = await getUserData(db);
    const dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid || dataValid.member.length < 4) {
      return conn.sendMessage(
        m.chat,
        { text: "Minimal 4 member untuk gacha party." },
        { quoted: m },
      );
    }

    let members = shuffle([...dataValid.member]);

    let tanks = shuffle(members.filter((m) => m.job === "TANK"));
    let supports = shuffle(members.filter((m) => m.job === "SUPPORT"));
    let dps = shuffle(members.filter((m) => m.job === "DPS"));

    const maxParty = 4;
    const parties = Array.from({ length: maxParty }, () => []);

    // =========================
    // ✅ TANK (MAX 1 PER PARTY)
    // =========================
    const selectedTanks = tanks.slice(0, totalTank);

    selectedTanks.forEach((tank, i) => {
      if (parties[i % maxParty].length < 4) {
        parties[i % maxParty].push(tank);
      }
    });

    // =========================
    // ✅ SUPPORT MERATA
    // =========================
    supports.forEach((sup, i) => {
      let placed = false;
      let start = i % maxParty;

      for (let j = 0; j < maxParty; j++) {
        let idx = (start + j) % maxParty;
        if (parties[idx].length < 4) {
          parties[idx].push(sup);
          placed = true;
          break;
        }
      }

      if (!placed) return;
    });

    // =========================
    // ✅ SISA MEMBER
    // =========================
    let remaining = [...tanks.slice(totalTank), ...dps];

    remaining = shuffle(remaining);

    remaining.forEach((mbr, i) => {
      let placed = false;
      let start = i % maxParty;

      for (let j = 0; j < maxParty; j++) {
        let idx = (start + j) % maxParty;
        if (parties[idx].length < 4) {
          parties[idx].push(mbr);
          placed = true;
          break;
        }
      }

      if (!placed) return;
    });

    const finalParties = parties.filter((p) => p.length > 0);

    let text = `*HASIL GACHA PARTY*\n`;
    text += `Total Tank dipakai: ${selectedTanks.length}\n\n`;

    finalParties.forEach((party, i) => {
      text += `*PARTY ${i + 1}*\n`;
      party.forEach((p, idx) => {
        text += `${idx + 1}. ${p.name} — ${p.job}\n`;
      });
      text += `\n`;
    });

    return conn.sendMessage(m.chat, { text }, { quoted: m });
  } catch (err) {
    console.error("GACHA RAID ERROR:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat gacha party." },
      { quoted: m },
    );
  }
};

handler.command = "gacharaid";
handler.category = "Raid Menu V2";

export default handler;
