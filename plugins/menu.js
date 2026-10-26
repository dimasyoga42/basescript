import path from "path";
import { config } from "../config.js";
import { buildSelectButton } from "../src/config/message.js";
import { getUserData } from "../src/config/func.js";

const db = path.resolve("db", "prefix.json");
const CAPTION_LIMIT = 1800; // batas karakter command di caption
const DEFAULT_CATEGORY = "menu admin"; // kategori yang tampil di caption awal
const THUMBNAIL = "https://server.neurasama.my.id/etc/thumbnail";

const INFO = `*Informasi Bot*
Library: Luna-lib(JS)
Version: 1.2.5
Website: https://dimasyogaaa.vercel.app
Owner: Dimas Yoga (085664393331)

*Rules*
- dilarang spam cmd tertentu
- dilarang membuat stiker jomok
- bot hanya merespon chat grub tidak chat pribadi`;

// Ambil prefix per chat (default ".")
async function getPrefix(chatId) {
  try {
    const data = await getUserData(db); // aman walau sync atau async
    const pref = Array.isArray(data) ? data.find((i) => i?.id === chatId) : null;
    return pref?.prefix || ".";
  } catch (e) {
    console.error("[menu] gagal baca prefix:", e.message);
    return ".";
  }
}

// Kelompokkan command berdasarkan kategori plugin
async function loadCategories() {
  const { plugins } = await import("./index.js");
  const categories = {};
  for (const plugin of Object.values(plugins)) {
    if (!plugin?.command) continue;
    const cmds = [plugin.command].flat().filter((c) => typeof c === "string");
    if (!cmds.length) continue;
    const cat = plugin.category || "other";
    (categories[cat] ??= []).push(...cmds);
  }
  return categories;
}

// Ambil baris sebanyak muat dalam limit, dipotong rapi per baris (bukan di tengah kata)
function fitLines(lines, limit) {
  const out = [];
  let len = 0;
  for (const line of lines) {
    if (len + line.length + 1 > limit) return { text: out.join("\n"), truncated: true };
    out.push(line);
    len += line.length + 1;
  }
  return { text: out.join("\n"), truncated: false };
}

const handler = async (m, { conn }) => {
  const query = (m.text || "").trim().split(/\s+/).slice(1).join(" ").trim().toLowerCase();

  const [categories, prefix] = await Promise.all([loadCategories(), getPrefix(m.chat)]);
  const catNames = Object.keys(categories);

  // Tombol pilih kategori
  const selectButton = buildSelectButton(
    "Menu Command",
    "Silahkan pilih salah satu",
    catNames.map((cat) => ({
      title: cat,
      description: `Lihat command ${cat}`,
      id: `${prefix}menu ${cat}`,
    })),
  );

  let body;
  const matched = catNames.find((c) => c.toLowerCase() === query);

  if (matched) {
    // .menu <kategori> -> tampilkan command kategori itu saja
    const cmds = categories[matched].map((c) => `➤ ${prefix}${c}`).join("\n");
    body = `*Kategori: ${matched}*\n${cmds}`;
  } else {
    // .menu -> info bot + kategori default (Menu Admin) saja, sisanya lewat tombol
    const defCat = catNames.find((c) => c.toLowerCase() === DEFAULT_CATEGORY);
    const notFound = query ? `_Kategori "${query}" tidak ditemukan._\n\n` : "";
    let list = "";
    if (defCat) {
      const lines = categories[defCat].map((c) => `➤ ${prefix}${c}`);
      const { text, truncated } = fitLines(lines, CAPTION_LIMIT);
      list = `*${defCat}*\n${text}${truncated ? "\n..." : ""}\n\n`;
    }
    body = `${INFO}\n\n${notFound}${list}_Pilih kategori lain lewat tombol di bawah_`;
  }

  await conn.sendButton(m.chat, {
    image: { url: THUMBNAIL },
    caption: body,
    buttons: [selectButton],
    button: [selectButton], // kompatibilitas versi luna-lib lama
    footer: config.OwnerName,
    bottom_sheet: true,
    bottom_name: "daftar menu",
  });
};

handler.command = "menu";
handler.alias = ["help"];
handler.category = "Menu Grub";

export default handler;
