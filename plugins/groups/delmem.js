import path from "path";
import { getUserData, saveUserData } from "../../src/config/func.js";
import { isAdmin } from "../_function/_admin.js";
import { buildSelectButton } from "../../src/config/message.js";

const db = path.resolve("db", "raidmem.json");

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const text = m.text || "";
    const arg = text.split("|").map((v) => v.trim());
    const name = arg[1];

    const data = getUserData(db) || [];
    const dataValid = data.find((item) => item.grubId === m.chat);

    if (!dataValid || dataValid.member.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "Belum ada member yang terdaftar di grup ini." },
        { quoted: m },
      );
    }

    // =========================
    // 🔥 MODE: tanpa nama -> tampilkan semua member jadi pilihan button
    // =========================
    if (!name) {
      const memberList = dataValid.member.map((item) => ({
        title: item.name,
        description: `Job: ${item.job}`,
        id: `.delmem |${item.name}`,
      }));

      console.log("DEBUG memberList:", memberList); // hapus baris ini setelah dicek berhasil

      return conn.sendButton(m.chat, {
        text: "Pilih member yang ingin dihapus:",
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "Hapus member",
            "Silahkan pilih salah satu",
            memberList,
          ),
        ],
        bottom_sheet: true,
        bottom_name: "Hapus member",
      });
    }

    // =========================
    // 🔥 MODE: hapus berdasarkan nama
    // =========================
    const targetIndex = dataValid.member.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );

    if (targetIndex === -1) {
      return conn.sendMessage(
        m.chat,
        { text: `Member dengan nama "${name}" tidak ditemukan.` },
        { quoted: m },
      );
    }

    const target = dataValid.member[targetIndex];
    dataValid.member.splice(targetIndex, 1);
    saveUserData(db, data);

    return conn.sendMessage(
      m.chat,
      {
        text: `Berhasil menghapus ${target.name} (${target.job}) dari daftar raid.`,
      },
      { quoted: m },
    );
  } catch (err) {
    console.error("DEL MEM ERROR:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi kesalahan saat menghapus member." },
      { quoted: m },
    );
  }
};

handler.command = "delmem";
handler.category = "Menu Raid";

export default handler;
