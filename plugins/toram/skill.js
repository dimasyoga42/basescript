import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const EXCLUDED_FIELD_NAMES = ["skill tree", "tier", "source"];

const parseRawEmbed = (rawEmbed) => {
  if (!rawEmbed) return null;

  try {
    return typeof rawEmbed === "string" ? JSON.parse(rawEmbed) : rawEmbed;
  } catch (err) {
    console.error("[skill] failed to parse raw_embed:", err.message);
    return null;
  }
};

const cleanFieldName = (rawName) => {
  let name = (rawName || "").trim();

  name = name.replace(/:\s*$/, "").trim();

  if (name.startsWith("[") && name.endsWith("]")) {
    name = name.slice(1, -1).trim();
  }

  return name;
};

const extractStatLines = (rawEmbed) => {
  const parsed = parseRawEmbed(rawEmbed);
  const fields = Array.isArray(parsed?.fields) ? parsed.fields : [];

  return fields
    .filter((field) => {
      const name = (field?.name || "")
        .toLowerCase()
        .replace(/:\s*$/, "")
        .trim();
      const value = (field?.value || "").trim();

      if (!name && !value) return false;
      if (EXCLUDED_FIELD_NAMES.some((excluded) => name.includes(excluded)))
        return false;

      return true;
    })
    .map((field) => {
      const name = cleanFieldName(field.name);
      const value = (field.value || "").trim();

      if (!name) return value;
      if (!value) return name;

      if (value.includes("\n")) {
        return `*${name}*\n${value}`;
      }

      return `${name}: ${value}`;
    })
    .filter(Boolean);
};

const formatSkill = (item) => {
  const statLines = extractStatLines(item.raw_embed);

  return [
    `*${item.name}* (Tier ${item.tier || "-"})`,
    `Skill Tree: ${item.skill_tree || "-"}${item.category ? ` (${item.category})` : ""}`,
    ``,
    `${item.description || "-"}`,
    ...(statLines.length ? ["", ...statLines] : []),
  ]
    .join("\n")
    .trim();
};

const buildSelectButton = (title, sectionTitle, rows) => ({
  name: "single_select",
  buttonParamsJson: JSON.stringify({
    title,
    sections: [{ title: sectionTitle, rows }],
  }),
});

const handler = async (m, { conn }) => {
  try {
    const query = (m.text || "").replace(/^\.skill\s*/i, "").trim();

    if (!query) {
      const { data, error } = await supa.from("skills").select("*");

      if (error || !data)
        return sendText(conn, m.chat, config.message.error, m);

      const trees = [
        ...new Set(data.map((v) => v.skill_tree).filter(Boolean)),
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
        .from("skills")
        .select("*")
        .ilike("skill_tree", `%${treeName}%`)
        .order("tier", { ascending: true });

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
              description: `Tier ${item.tier || "-"}`,
              id: `.skill ${item.name}`,
            })),
          ),
        ],
      });
    }

    const { data, error } = await supa
      .from("skills")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, `Skill *"${query}"* tidak ditemukan.`, m);

    if (data.length === 1)
      return sendText(conn, m.chat, formatSkill(data[0]), m);

    return conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* skill untuk "*${query}*":`,
      footer: config.OwnerName,
      buttons: [
        buildSelectButton(
          "Pilih Skill",
          "Hasil Pencarian",
          data.map((item) => ({
            title: item.name,
            description: `Tier ${item.tier || "-"} · ${item.skill_tree || "-"}`,
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
