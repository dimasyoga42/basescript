import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const formatStats = (stats) =>
  (stats || "")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s && !/^amount$/i.test(s))
    .join("\n- ");

const formatItem = (item) => `*${item.ItemName}* ${item.Category || "-"}
Stats Effect
${formatStats(item.Effects)}
proses:
- process: ${item.Process || "-"}
- Duration: ${item.Duration || "-"}
- Drop From: ${item.ObtainedFrom || "-"}`;

const handler = async (m, { conn }) => {
  try {
    const parts = (m.text || "").trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "Format anda salah\nContoh: .item nama item" },
        { quoted: m },
      );
    }

    const { data: exactData, error: exactError } = await supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom")
      .ilike("ItemName", query);

    if (!exactError && exactData && exactData.length > 0) {
      if (exactData.length === 1) {
        return conn.sendMessage(
          m.chat,
          { text: formatItem(exactData[0]).trim() },
          { quoted: m },
        );
      }
      const text = exactData.map((item) => formatItem(item)).join("\n\n");
      return conn.sendMessage(m.chat, { text }, { quoted: m });
    }

    const { data, error } = await supa
      .from("item_v2")
      .select("ItemName, Category, Process, Duration, Effects, ObtainedFrom")
      .ilike("ItemName", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0) {
      return conn.sendMessage(
        m.chat,
        { text: "item tidak ditemukan" },
        { quoted: m },
      );
    }

    if (data.length === 1) {
      return conn.sendMessage(
        m.chat,
        { text: formatItem(data[0]).trim() },
        { quoted: m },
      );
    }

    return await conn.sendButton(m.chat, {
      text: `Ditemukan ${data.length} item untuk: "${query}"\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.ItemName,
          id: `.item ${item.ItemName}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Menu Item",
    });
  } catch (err) {
    console.log("ERR ITEM:", err.message);
    await conn.sendMessage(
      m.chat,
      { text: "terjadi error tidak terduga" },
      { quoted: m },
    );
  }
};

handler.command = "item";
handler.category = "Toram Search";

export default handler;
