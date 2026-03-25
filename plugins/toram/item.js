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
      .from("item_v2")
      .select(
        "ItemName, Category, SellPrice, Process, Duration, Effects, OrbtainedFrom, RecipeMaterials, Link",
      )
      .ilike("Item Name", `%${name}%`);

    if (!data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    const mtext = data
      .map(
        (item) =>
          `Name Item: ${item.ItemName}\nCategory:${item.Category}\nSell Price: ${item.SellPrice}\nProcess: ${item.Process || "-"}\nDuration: ${item.Duration || "-"}\nstat:\n${item.Effects || "-"}\ndrops:\n${item.OrbtainedFrom}\nSource: ${item.Link}`,
      )
      .join("\n────────────────────────\n");

    sendText(conn, m.chat, mtext, m);
  } catch (err) {
    sendText(conn, m.chat, err.message, m);
  }
};

handler.command = "item";
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
