import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
import { sendInteractiveMessage } from "@ryuu-reinzz/button-helper";

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
    const jid = m.chat;
    const text = (m.text || "").trim();
    const query = text.replace(/^\.skill\s*/i, "").trim();

    // 🔥 .skill → tampil skilltree
    if (!query) {
      const { data, error } = await supa.from("skill_v2").select("skilltree");

      if (error || !data) return sendText(conn, jid, config.message.error, m);

      const trees = [...new Set(data.map((v) => v.skilltree).filter(Boolean))];

      return await sendInteractiveMessage(conn, jid, {
        text: "Pilih Skill Tree:",
        footer: config.OwnerName,
        interactiveButtons: [
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
                    description: `Lihat skill ${tree}`,
                    id: `.skill --tree ${tree}`,
                  })),
                },
              ],
            }),
          },
        ],
      });
    }

    // 🔥 filter by skilltree
    if (query.startsWith("--tree")) {
      const treeName = query.replace("--tree", "").trim();

      const { data, error } = await supa
        .from("skilv2")
        .select("name")
        .ilike("skilltree", treeName);

      if (error || !data || data.length === 0)
        return sendText(conn, jid, "skill tidak ditemukan", m);

      return await sendInteractiveMessage(conn, jid, {
        text: `Skill Tree: ${treeName}`,
        footer: config.OwnerName,
        interactiveButtons: [
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
                    description: "Lihat detail",
                    id: `.skill ${item.name}`,
                  })),
                },
              ],
            }),
          },
        ],
      });
    }

    // 🔥 exact match
    const { data: exactData } = await supa
      .from("skilv2")
      .select(
        "name,desc,skilltree,Tier,mpcost,range,Skill Type,combo,Motion Speed,Proration Used,Proration Inflicted,info",
      )
      .ilike("name", query)
      .limit(1);

    if (exactData && exactData.length === 1) {
      return sendText(conn, jid, formatSkill(exactData[0]), m);
    }

    // 🔥 partial match
    const { data } = await supa
      .from("skilv2")
      .select("name")
      .ilike("name", `%${query}%`);

    if (!data || data.length === 0)
      return sendText(conn, jid, config.message.notFound, m);

    // 🔥 kalau 1 → langsung detail
    if (data.length === 1) {
      const { data: detail } = await supa
        .from("skilv2")
        .select(
          "name,desc,skilltree,Tier,mpcost,range,Skill Type,combo,Motion Speed,Proration Used,Proration Inflicted,info",
        )
        .ilike("name", data[0].name)
        .limit(1);

      return sendText(conn, jid, formatSkill(detail[0]), m);
    }

    // 🔥 banyak → list picker
    return await sendInteractiveMessage(conn, jid, {
      text: `Ditemukan ${data.length} skill`,
      footer: config.OwnerName,
      interactiveButtons: [
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
                  description: "Lihat detail",
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
