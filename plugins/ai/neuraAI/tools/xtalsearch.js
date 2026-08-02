import { supa } from "../../../../src/config/supa.js";

/**
 * Ambil SEMUA xtal beserta stat-nya sekaligus.
 * Dipakai supaya AI neura punya gambaran lengkap semua stat yang ada
 * sebelum memberikan rekomendasi xtal terbaik.
 */
export const xtalStatsDump = async () => {
  const { data, error } = await supa
    .from("xtal")
    .select("name, type, stats")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return "Data xtal tidak ditemukan.";
  }

  return data
    .map(
      (item) =>
        `- ${item.name} (${item.type ?? "-"}): ${item.stats ?? "-"}`,
    )
    .join("\n");
};

/**
 * Cari xtal berdasarkan kata kunci stat (misal "critical damage", "hp", "attack speed").
 * Mengembalikan daftar xtal yang stat-nya mengandung kata kunci tersebut,
 * agar AI bisa langsung merekomendasikan tanpa harus memuat semua data.
 */
export const xtalStatSearch = async (statKeyword) => {
  const keyword = String(statKeyword ?? "").trim();
  if (!keyword) {
    return "Masukkan stat yang ingin dicari (misal: critical damage, attack speed).";
  }

  const escaped = keyword.replace(/[%_]/g, (c) => `\\${c}`);

  const { data, error } = await supa
    .from("xtal")
    .select("name, type, stats, upgrade_route, max_upgrade_route")
    .ilike("stats", `%${escaped}%`)
    .limit(30);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return `Tidak ada xtal dengan stat mengandung "${keyword}".`;
  }

  return `Ditemukan ${data.length} xtal dengan stat "${keyword}":\n\n${data
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.type ?? "-"})\n   Stat: ${
          item.stats ?? "-"
        }\n   Rute: ${item.upgrade_route ?? "-"} → ${
          item.max_upgrade_route ?? "-"
        }`,
    )
    .join("\n\n")}`;
};
