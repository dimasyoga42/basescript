import { supa } from "../../../../src/config/supa.js"

export const xtalFinder = async (name) => {
  try {
    const db = await supa.from("xtal").select("name, type, upgrade_rute, stats, max_upgrade_route").ilike("name", name)
    if (!db) return "xtal tidak ada"
    return db.data.map((item) => `${item.name}\n *${item.type}*\n Stat Effect:\n ${item.stats}\n Rute:\n- ${item.upgrade_rute | "-"}\n- ${item.max_upgrade_route | "-"}`)
  } catch (err) {
    throw new err
  }
}
