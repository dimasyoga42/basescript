import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

// 🔥 format output
const formatSkill = (item) =>
  `*${item.name}* (Tier ${item.Tier || "-"})
${item.desc || "-"}

MP: ${item.mpcost || "-"}
Range: ${item.range || "-"}
Type: ${item["Skill Type"] || "-"}
Combo: ${item.combo || "-"}
Motion: ${item["Motion Speed"] || "-"}
Proration: ${item["Proration Used"] || "-"} / ${item["Proration Inflicted"] || "-"}

${item.info || "-"}`.trim();

const handler = async (m, { conn }) => {
  try {
    const text = extractBody(m).trim();
    const query = text.replace(/^\.skill\s*/i, "").trim();

    // 🔥 .skill → tampil skilltree
    if (!query) {
      const { data, error } = await supa.from("skilv2").select("skilltree");

      if (error || !data)
        return sendText(conn, m.chat, config.message.error, m);

      const trees = [...new Set(data.map((v) => v.skilltree).filter(Boolean))];

      return await conn.sendButton(m.chat, {
        text: "Pilih Skill Tree:",
        footer: config.OwnerName,
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "Skill Tree",
              sections: [
                {
                  title: "Daftar Skill Tree",
                  rows: trees.map((tree) => ({
                    header: "Tree",
                    title: tree,
                    description: `Lihat skill dari ${tree}`,
                    id: `.skill --tree ${tree}`,
                  })),
                },
              ],
            }),
          },
        ],
      });
    }

    // 🔥 filter skilltree
    if (/^--tree/i.test(query)) {
      const treeName = query.replace(/^--tree/i, "").trim();

      const { data, error } = await supa
        .from("skilv2")
        .select("name")
        .ilike("skilltree", `%${treeName}%`);

      if (error || !data || data.length === 0)
        return sendText(conn, m.chat, "skill tidak ditemukan", m);

      return await conn.sendButton(m.chat, {
        text: `Skill Tree: *${treeName}*`,
        footer: config.OwnerName,
        buttons: [
          {
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "List Skill",
              sections: [
                {
                  title: treeName,
                  rows: data.map((item) => ({
                    header: "Skill",
                    title: item.name,
                    description: "Lihat detail skill",
                    id: `.skill ${item.name}`,
                  })),
                },
              ],
            }),
          },
        ],
      });
    }

    // 🔥 search skill
    const { data, error } = await supa
      .from("skilv2")
      .select(
        "name,desc,skilltree,Tier,mpcost,range,Skill Type,combo,Motion Speed,Proration Used,Proration Inflicted,info",
      )
      .ilike("name", `%${query}%`)
      .limit(20);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    // 🔥 kalau 1 → langsung tampil
    if (data.length === 1) {
      return sendText(conn, m.chat, formatSkill(data[0]), m);
    }

    // 🔥 banyak → button
    return await conn.sendButton(m.chat, {
      text: `Ditemukan ${data.length} skill`,
      footer: config.OwnerName,
      buttons: [
        {
          name: "single_select",
          buttonParamsJson: JSON.stringify({
            title: "Pilih Skill",
            sections: [
              {
                title: "Hasil Pencarian",
                rows: data.map((item) => ({
                  header: "Skill",
                  title: item.name,
                  description: `Tier ${item.Tier || "-"}`,
                  id: `.skill ${item.name}`,
                })),
              },
            ],
          }),
        },
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
