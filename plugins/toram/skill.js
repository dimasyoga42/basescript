import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const parts = m.text.trim().split(/\s+/);
    const query = parts.slice(1).join(" ").trim();

    // ✅ .skill --list → tampilkan semua tree sebagai button
    if (query === "--list") {
      const { data, error } = await supa
        .from("skill")
        .select(`"Skill Tree"`)
        .order("Skill Tree");

      if (error || !data || data.length === 0)
        return sendText(conn, m.chat, config.message.notFound, m);

      // Ambil tree unik
      const trees = [
        ...new Set(data.map((d) => d["Skill Tree"]).filter(Boolean)),
      ];

      await conn.sendButton(m.chat, {
        caption: `⚔️ *Daftar Skill Tree*\n${"─".repeat(20)}\nPilih tree untuk melihat skill:`,
        image: { url: thumbnail },
        footer: config.OwnerName,
        buttons: trees.map((tree) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: `${tree}`,
            id: `.skill --list ${tree}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Pilih Skill Tree",
      });

      return;
    }

    // ✅ .skill --list {tree} → tampilkan semua skill di tree sebagai button
    if (query.startsWith("--list ")) {
      const treeQuery = query.replace(/^--list\s*/i, "").trim();

      const { data, error } = await supa
        .from("skill")
        .select(`"Skill Tree","Nama Skill"`)
        .ilike("Skill Tree", `%${treeQuery}%`)
        .order("Nama Skill");

      if (error || !data || data.length === 0)
        return sendText(conn, m.chat, config.message.notFound, m);

      const caption =
        `*${treeQuery}*\n${"─".repeat(20)}\n` +
        `Total: ${data.length} skill\n\nPilih skill untuk detail:`;

      await conn.sendButton(m.chat, {
        caption,
        image: { url: thumbnail },
        footer: config.OwnerName,
        buttons: data.slice(0, 10).map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: `${item["Nama Skill"]}`,
            id: `.skill ${item["Nama Skill"]}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: `Skill ${treeQuery}`,
      });

      return;
    }

    if (!query) {
      await conn.sendButton(m.chat, {
        caption: `*Skill Search*\n${"─".repeat(20)}\n\n*Cara penggunaan:*\n• .skill Hard Hit → cari skill\n• .skill --list → semua tree\n• .skill --list Blade → skill per tree`,
        image: { url: thumbnail },
        footer: config.OwnerName,
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "Lihat Semua Tree",
              id: `.skill --list`,
            }),
          },
        ],
        bottom_sheet: true,
        bottom_name: "Skill Menu",
      });
      return;
    }

    const { data, error } = await supa
      .from("skill")
      .select(
        `"Skill Tree","Nama Skill","Type","MP Cost","Element","Deskripsi","Deskripsi_Indo"`,
      )
      .ilike("Nama Skill", `%${query}%`);

    if (error || !data || data.length === 0)
      return sendText(conn, m.chat, config.message.notFound, m);

    // 1 hasil → detail
    if (data.length === 1) {
      const item = data[0];
      return sendText(
        conn,
        m.chat,
        `*${item["Nama Skill"]}*\n${"─".repeat(20)}\n` +
          `Tree    : ${item["Skill Tree"] || "-"}\n` +
          `Type    : ${item["Type"] || "-"}\n` +
          `MP Cost : ${item["MP Cost"] || "-"}\n` +
          `Element : ${item["Element"] || "-"}\n\n` +
          `*Deskripsi:*\n${item["Deskripsi"] || "-"}\n\n` +
          `*Terjemahan:*\n${item["Deskripsi_Indo"] || "-"}`,
        m,
      );
    }

    // Banyak hasil → button pilihan
    await conn.sendButton(m.chat, {
      caption:
        `⚔️ *Hasil: ${query}*\n${"─".repeat(20)}\n` +
        `Ditemukan ${data.length} skill\n\nPilih untuk detail:`,
      image: { url: thumbnail },
      footer: config.OwnerName,
      buttons: data.slice(0, 10).map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: `${item["Nama Skill"]}`,
          id: `.skill ${item["Nama Skill"]}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Pilih Skill",
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

handler.command = ["skill"];
handler.category = "Toram Info";
handler.submenu = "Toram";
export default handler;
