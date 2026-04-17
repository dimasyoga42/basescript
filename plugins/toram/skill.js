import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

// ─── Format output detail skill ───────────────────────────────────────────────
const formatSkill = (item) =>
  [
    `*${item.name}* (Tier ${item.Tier || "-"})`,
    `${item.desc || "-"}`,
    ``,
    `MP       : ${item.mpcost || "-"}`,
    `Range    : ${item.range || "-"}`,
    `Type     : ${item["Skill Type"] || "-"}`,
    `Combo    : ${item.combo || "-"}`,
    `Motion   : ${item["Motion Speed"] || "-"}`,
    `Proration: ${item["Proration Used"] || "-"} / ${item["Proration Inflicted"] || "-"}`,
    ``,
    `${item.info || ""}`,
  ]
    .join("\n")
    .trim();

// ─── Helper build single_select button ────────────────────────────────────────
const buildSelectButton = (title, sectionTitle, rows) => ({
  name: "single_select",
  buttonParamsJson: JSON.stringify({
    title,
    sections: [{ title: sectionTitle, rows }],
  }),
});

// ─── Handler ──────────────────────────────────────────────────────────────────
const handler = async (m, { conn }) => {
  try {
    const query = (m.text || "").replace(/^\.skill\s*/i, "").trim();

    // ── Tanpa query → tampilkan daftar skill tree ────────────────────────────
    if (!query) {
      const { data, error } = await supa.from("skilv2").select("*");

      if (error || !data)
        return sendText(conn, m.chat, config.message.error, m);

      const trees = [
        ...new Set(data.map((v) => v.skilltree).filter(Boolean)),
      ].sort();

      if (trees.length === 0)
        return sendText(conn, m.chat, "Tidak ada skill tree tersedia.", m);

      return conn.sendButton(m.chat, {
        text: "Pilih skill tree yang ingin kamu lihat:",
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "Skill Tree",
            "Daftar Skill Tree",
            trees.map((tree) => ({
              title: tree,
              description: `Lihat skill dari ${tree}`,
              id: `.skill --tree ${tree}`,
            })),
          ),
        ],
      });
    }

    // ── --tree <nama> → tampilkan skill dalam tree ───────────────────────────
    if (/^--tree\s+/i.test(query)) {
      const treeName = query.replace(/^--tree\s+/i, "").trim();

      if (!treeName)
        return sendText(
          conn,
          m.chat,
          "Masukan nama skill tree setelah `--tree`.",
          m,
        );

      const { data, error } = await supa
        .from("skilv2")
        .select("*")
        .ilike("skilltree", `%${treeName}%`)
        .order("Tier", { ascending: true });

      if (error || !data || data.length === 0)
        return sendText(
          conn,
          m.chat,
          `Skill tree *"${treeName}"* tidak ditemukan.`,
          m,
        );

      return conn.sendButton(m.chat, {
        text: `Skill Tree: *${treeName}*\nTotal: ${data.length} skill`,
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "List Skill",
            treeName,
            data.map((item) => ({
              title: item.name,
              description: `Tier ${item.Tier || "-"}`,
              id: `.skill ${item.name}`,
            })),
          ),
        ],
      });
    }

    // ── Search skill by name ─────────────────────────────────────────────────
    const { data, error } = await supa
      .from("skilv2")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, `Skill *"${query}"* tidak ditemukan.`, m);

    // Kalau tepat 1 hasil → langsung tampil detail
    if (data.length === 1)
      return sendText(conn, m.chat, formatSkill(data[0]), m);

    // Banyak hasil → button pilihan
    return conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* skill untuk "*${query}*":`,
      footer: config.OwnerName,
      buttons: [
        buildSelectButton(
          "Pilih Skill",
          "Hasil Pencarian",
          data.map((item) => ({
            title: item.name,
            description: `Tier ${item.Tier || "-"} · ${item.skilltree || "-"}`,
            id: `.skill ${item.name}`,
          })),
        ),
      ],
    });
  } catch (err) {
    console.error("[skill]", err.message);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = "skill";
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
