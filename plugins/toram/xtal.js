import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const sendXtalResult = (conn, chat, m, item) => {
  const routes = (item.max_upgrade_route || "")
    .split("->")
    .map((x) => x.trim())
    .filter(Boolean);

  const text = `*${item.name}* ${item.type || "-"}
${item.stats || "-"}
${item.upgrade_route ? `rute: ${item.upgrade_route}` : ""}`.trim();

  if (routes.length === 0) {
    return conn.sendMessage(chat, { text }, { quoted: m });
  }

  return conn.sendButton(chat, {
    text,
    footer: config.BotName,
    buttons: routes.map((r) => ({
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({
        display_text: r,
        id: `.xtal ${r}`,
      }),
    })),
    bottom_sheet: true,
    bottom_name: "Upgrade Route",
  });
};

const handler = async (m, { conn }) => {
  try {
    const query = (m.text || "").trim().split(/\s+/).slice(1).join(" ").trim();

    if (!query) {
      return conn.sendMessage(
        m.chat,
        { text: "Contoh: .xtal nama" },
        { quoted: m },
      );
    }

    // exact match
    const { data: exact } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .eq("name", query)
      .limit(1);

    if (exact?.length === 1) return sendXtalResult(conn, m.chat, m, exact[0]);

    // partial match
    const { data } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", `%${query}%`)
      .limit(20);

    if (!data?.length) {
      return conn.sendMessage(
        m.chat,
        { text: `*${query}* tidak ditemukan.` },
        { quoted: m },
      );
    }

    if (data.length === 1) return sendXtalResult(conn, m.chat, m, data[0]);

    return conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* hasil untuk: _${query}_`,
      footer: config.BotName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Pilih Xtal",
    });
  } catch (err) {
    console.log("ERR XTAL:", err.message);
  }
};

handler.command = "xtall";
handler.alias = ["xtal"];
handler.category = "Toram Search";
export default handler;
