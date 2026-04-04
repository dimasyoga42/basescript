import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text.replace(/\.bos|.boss/, "").trim();
    if (!text)
      return conn.sendMessage(
        m.chat,
        { text: "masukan nama bos setelah .boss / .bos" },
        m,
      );
    const db = await supa
      .from("bosv22")
      .select("name, element, location, drop, range")
      .ilike("name", `%${text}%`)
      .limit(1);
    console.log(db);
  } catch (err) {}
};
handler.command = "bos";
handler.alias = ["boss"];
handler.category = "Toram Search";
export default handler;
