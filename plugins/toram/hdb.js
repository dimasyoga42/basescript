import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const text = m.text || "";
    const arg = text.split(" ");
    const name = arg.slice(1).join(" ").trim();

    if (!name) {
      const { data: db, error } = await supa.from("hdb").select("bosname");

      if (error || !db || db.length === 0) {
        return sendText(conn, m.chat, "Data kosong", m);
      }

      return await conn.sendButton(m.chat, {
        text: `Pilih salah satu boss:`,
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.bosname,
            id: `.hdb ${item.bosname}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "HDB LIST",
      });
    }

    // ================= SEARCH =================
    const { data, error } = await supa
      .from("hdb")
      .select("bosname, stat")
      .ilike("bosname", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return sendText(conn, m.chat, config.message.notFound, m);
    }

    return sendText(conn, m.chat, data.stat, m);
  } catch (err) {
    console.error("HDB ERROR:", err);

    return sendText(
      conn,
      m.chat,
      "Terjadi Kesalahan Pada Saat Pengambilan data",
      m,
    );
  }
};

handler.command = ["hdb"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
