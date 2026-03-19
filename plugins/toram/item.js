import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(/\.item/, "").trim();
    if (!name)
      return sendText(
        conn,
        m.chat,
        `${config.message.invalid}\nuse: .item name`,
        m,
      );
    const { data } = await supa
      .from("item")
      .select("nama, jenis, stat, drop")
      .ilike("nama", `%${name}%`);

    if (!data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    const mtext = data
      .map(
        (item) =>
          `${item.nama}(${item.jenis})\nstat:\n${item.stat}\ndrop:\n${item.drop}\n`,
      )
      .join("\n────────────────────────\n");

    sendText(conn, m.chat, mtext, m);
  } catch (err) {
    sendText(conn, m.chat, err.message, m);
  }
};

handler.command = "item";
handler.category = "Menu Search";
handler.submenu = "Toram";
export default handler;
