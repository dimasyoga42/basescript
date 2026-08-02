import { supa } from "../../../../src/config/supa.js";

export const xtalFinder = async (name) => {
  try {
    const { data, error } = await supa
      .from("xtal")
      .select("name, type, upgrade_rute, stats, max_upgrade_route")
      .ilike("name", `%${name}%`).limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return "xtal tidak ada";
    }

    return data.map(
      (item) => `${item.name}
*${item.type}*
Stat Effect:
${item.stats}

Rute:
- ${item.upgrade_rute ?? "-"}
- ${item.max_upgrade_route ?? "-"}`
    );
  } catch (err) {
    throw err;
  }
};
