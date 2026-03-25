import { config } from "../../config.js";
import { sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn, text }) => {
  try {
    // Menggunakan parameter 'text' bawaan handler agar lebih bersih
    const query = text ? text.trim() : "";

    if (!query) {
      return sendText(
        conn,
        m.chat,
        `*Format Salah*\n\nGunakan: .item [nama item]\nContoh: .item salt`,
        m,
      );
    }

    // Query ke database Supabase
    const { data, error } = await supa
      .from("item_v2")
      .select(
        "ItemName, Category, SellPrice, Process, Duration, Effects, OrbtainedFrom, RecipeMaterials, Link",
      )
      .ilike("ItemName", `%${query}%`)
      .limit(10); // Membatasi hasil agar pesan tidak terlalu panjang

    if (error) throw error;

    if (!data || data.length === 0) {
      return sendText(conn, m.chat, config.message.notFound, m);
    }

    // Mapping data ke format pesan yang lebih rapi
    const mtext = data
      .map((item) => {
        return [
          `*Name Item:* ${item.ItemName}`,
          `*Category:* ${item.Category}`,
          `*Sell Price:* ${item.SellPrice}`,
          `*Process:* ${item.Process || "-"}`,
          `*Duration:* ${item.Duration || "-"}`,
          `*Stats:* \n${item.Effects || "-"}`,
          `*Recipe:* \n${item.RecipeMaterials || "-"}`,
          `*Obtained From:* \n${item.OrbtainedFrom || "-"}`,
          `*Source:* ${item.Link}`,
        ].join("\n");
      })
      .join("\n\n────────────────────────\n\n");

    const header = `*Toram Item Search*\nFound: ${data.length} results\n\n`;
    sendText(conn, m.chat, header + mtext, m);
  } catch (err) {
    console.error(err);
    sendText(conn, m.chat, `*Error:* ${err.message}`, m);
  }
};

handler.command = /^(item)$/i;
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
