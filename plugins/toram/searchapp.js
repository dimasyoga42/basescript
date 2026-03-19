import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(/\.searchapp/, "").trim();
    if (!name) return sendText(conn, m.chat, config.message.invalid, m);

    const { data, error } = await supa
      .from("appview")
      .select("name")
      .ilike("name", `%${name}%`)
      .limit(20);

    if (!data || error)
      return sendText(conn, m.chat, config.message.notFound, m);
    let mtext = `App Name Found:\n`;
    mtext += data.map((item) => `- ${item.name}`).join("\n");
    return sendText(conn, m.chat, mtext, m);
  } catch (err) {
    sendText(conn, m.chat, config.message.error);
  }
};
handler.command = "searchapp";
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
