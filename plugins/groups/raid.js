import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "raidmem.json");

const handler = async (m, { conn }) => {
  try {
    const text = m.text || "";
    const isEdit = text.includes("--edit");

    const cleanText = text.replace("--edit", "").trim();
    const arg = cleanText.split("|").map((v) => v.trim());

    const validIsjob = ["DPS", "TANK", "SUPPORT"];
    const name = arg[1];
    const job = arg[2];

    if (!name || !job) {
      return conn.sendMessage(
        m.chat,
        {
          text: isEdit
            ? "Format salah! Gunakan: .daftarraid --edit |<name>|<job>"
            : "Format salah! Gunakan: .daftarraid |<name>|<job>",
        },
        { quoted: m },
      );
    }

    const jobUpper = job.toUpperCase();

    if (!validIsjob.includes(jobUpper)) {
      return conn.sendMessage(
        m.chat,
        {
          text: "Jobs tidak valid!\nGunakan:\n- DPS\n- TANK\n- SUPPORT",
        },
        { quoted: m },
      );
    }

    const data = getUserData(db) || [];

    let dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid) {
      dataValid = {
        grubId: m.chat,
        member: [],
      };
      data.push(dataValid);
    }

    const userIndex = dataValid.member.findIndex(
      (item) => item.id === m.sender,
    );

    // =========================
    // 🔥 MODE EDIT
    // =========================
    if (isEdit) {
      if (userIndex === -1) {
        return conn.sendMessage(
          m.chat,
          { text: "Kamu belum terdaftar, tidak bisa edit." },
          { quoted: m },
        );
      }

      const oldData = dataValid.member[userIndex];

      // cek nama bentrok (kecuali milik sendiri)
      const nameExist = dataValid.member.find(
        (item, i) =>
          item.name.toLowerCase() === name.toLowerCase() && i !== userIndex,
      );

      if (nameExist) {
        return conn.sendMessage(
          m.chat,
          {
            text: `Nama ${name} sudah digunakan oleh member lain!`,
          },
          { quoted: m },
        );
      }

      dataValid.member[userIndex] = {
        id: m.sender,
        name,
        job: jobUpper,
      };

      saveUserData(db, data);

      return conn.sendMessage(
        m.chat,
        {
          text: `Data berhasil diupdate!\n\nSebelumnya: ${oldData.name} (${oldData.job})\nSekarang: ${name} (${jobUpper})`,
        },
        { quoted: m },
      );
    }

    // =========================
    // 🔥 MODE DAFTAR
    // =========================
    if (userIndex !== -1) {
      const userExist = dataValid.member[userIndex];
      return conn.sendMessage(
        m.chat,
        {
          text: `Kamu sudah terdaftar sebagai ${userExist.name} (${userExist.job})\nGunakan --edit untuk mengubah.`,
        },
        { quoted: m },
      );
    }

    const nameExist = dataValid.member.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (nameExist) {
      return conn.sendMessage(
        m.chat,
        {
          text: `Nama ${name} sudah digunakan oleh member lain!`,
        },
        { quoted: m },
      );
    }

    dataValid.member.push({
      id: m.sender,
      name,
      job: jobUpper,
    });

    saveUserData(db, data);

    return conn.sendMessage(
      m.chat,
      {
        text: `${name} berhasil didaftarkan sebagai ${jobUpper}!`,
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("DAFTAR RAID ERROR:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat mendaftar raid." },
      { quoted: m },
    );
  }
};

handler.command = "daftarraid";
handler.category = "Raid Menu V2";

export default handler;
