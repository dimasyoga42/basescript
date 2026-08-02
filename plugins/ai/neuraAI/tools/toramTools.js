import { supa } from "../../../../src/config/supa.js";

export const xtalFinder = async (name) => {
  const keyword = String(name ?? "").trim();

  if (!keyword) {
    return "Masukkan nama xtal.";
  }

  const { data, error } = await supa
    .from("xtal")
    .select(
      "name, type, upgrade_rute, stats, max_upgrade_route",
    )
    .ilike("name", `%${keyword}%`);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return "Xtal tidak ditemukan.";
  }

  if (data.length > 1) {
    return `Ditemukan ${data.length} xtal:\n\n${data
      .map((item, index) => `${index + 1}. ${item.name}`)
      .join("\n")}`;
  }

  const item = data[0];

  return `${item.name}

*${item.type ?? "-" }*

Stat Effect:
${item.stats ?? "-"}

Rute:
- ${item.upgrade_rute ?? "-"}
- ${item.max_upgrade_route ?? "-"}`;
};
