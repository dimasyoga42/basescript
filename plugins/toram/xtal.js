import { config } from "../../config.js";
import { supa } from "../../src/config/supa.js";

const parseRoute = (route) =>
  (route || "")
    .split("->")
    .map((r) => r.trim())
    .filter((r) => r);

const mergeRoutes = (normalRoutes, maxRoutes) => {
  const seen = new Set();
  const result = [];

  for (const r of [...normalRoutes, ...maxRoutes]) {
    if (!seen.has(r)) {
      seen.add(r);
      result.push(r);
    }
  }

  return result;
};

const sendXtalResult = (conn, chat, m, item) => {
  const text = `*${item.name}* ${item.type || "-"}
${item.stats || "-"}
rute:
- ${item.upgrade_route || "-"}
- ${item.max_upgrade_route || "-"}`.trim();

  const normalRoutes = parseRoute(item.upgrade_route);
  const maxRoutes = parseRoute(item.max_upgrade_route);
  const routes = mergeRoutes(normalRoutes, maxRoutes);

  console.log("upgrade_route:", item.upgrade_route);
  console.log("max_upgrade_route:", item.max_upgrade_route);
  console.log("routes merged:", routes);

  if (!routes.length) {
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

    // ========================
    // MODE --all
    // ========================
    if (query === "--all") {
      const { data: db, error } = await supa
        .from("xtal")
        .select("name")
        .order("name", { ascending: true });

      if (error || !db?.length) {
        return conn.sendMessage(
          m.chat,
          { text: "Data xtal kosong / error." },
          { quoted: m },
        );
      }

      return conn.sendButton(m.chat, {
        text: "Pilih salah satu:",
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.xtal ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "List Xtal",
      });
    }

    // ========================
    // EXACT MATCH
    // ========================
    const { data: exact, error: errExact } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", query)
      .limit(1);

    if (!errExact && exact?.length === 1) {
      return sendXtalResult(conn, m.chat, m, exact[0]);
    }

    // ========================
    // PARTIAL MATCH
    // ========================
    const { data, error } = await supa
      .from("xtal")
      .select("name, type, upgrade_route, stats, max_upgrade_route")
      .ilike("name", `%${query}%`)
      .limit(20);

    if (error || !data?.length) {
      return conn.sendMessage(
        m.chat,
        { text: `*${query}* tidak ditemukan.` },
        { quoted: m },
      );
    }

    if (data.length === 1) {
      return sendXtalResult(conn, m.chat, m, data[0]);
    }

    return conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* xtal untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.xtal ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Menu Xtal",
    });
  } catch (err) {
    console.log("ERR XTAL:", err);
    return conn.sendMessage(
      m.chat,
      { text: "Terjadi error tidak terduga." },
      { quoted: m },
    );
  }
};

handler.command = "xtall";
handler.alias = ["xtal"];
handler.category = "Toram Search";

export default handler;
