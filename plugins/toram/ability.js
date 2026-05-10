import translate from "google-translate-api-x";
import { config, thumbnail } from "../../config.js";
import {
  buildSelectButton,
  editText,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

async function translateText(text, to = "en") {
  try {
    if (!text) return text;

    const result = await translate(text, { to });

    return result.text || text;
  } catch (err) {
    console.error("[translate]", err);

    return text;
  }
}

const handler = async (m, { conn }) => {
  try {
    const text = (m.text || "").trim();
    const parts = text.split(/\s+/);

    const isTranslate = parts[1] === "--ing";

    const query = isTranslate
      ? parts.slice(2).join(" ").trim()
      : parts.slice(1).join(" ").trim();

    // LIST SEMUA TRAIT
    if (!query) {
      const { data, error } = await supa
        .from("ablityv2")
        .select("name")
        .order("name", { ascending: true });

      if (error || !data?.length) {
        return sendText(conn, m.chat, "Gagal mengambil daftar ability.", m);
      }

      return await conn.sendButton(m.chat, {
        text: "Pilih salah satu ability:",
        footer: config.OwnerName,
        buttons: [
          buildSelectButton(
            "Daftar Trait",
            "Silahkan pilih salah satu",
            data.map((item) => ({
              title: item.name,
              description: `Lihat Stat dari ${item.name}`,
              id: `.trait ${item.name}`,
            })),
          ),
        ],
        bottom_sheet: true,
        bottom_name: "Menu Ability",
      });
    }

    // EXACT MATCH
    const { data: exactData, error: exactError } = await supa
      .from("ablityv2")
      .select("*")
      .ilike("name", query)
      .limit(1);

    if (!exactError && exactData?.length === 1) {
      const item = exactData[0];

      let statEffect = item.stat_effect;

      if (isTranslate) {
        statEffect = await translateText(item.stat_effect, "en");
      }

      return conn.sendButton(m.chat, {
        text: `*${item.name}*\n\n${statEffect}`,
        footer: "Neurainc",
        buttons: [
          buildSelectButton("Translate", "Bahasa Yang Tersedia", [
            {
              title: "Bahasa Inggris",
              description: "Ubah ke bahasa Inggris",
              id: `.trait --ing ${item.name}`,
            },
            {
              title: "Bahasa Indonesia",
              description: "Kembali ke bahasa asli",
              id: `.trait ${item.name}`,
            },
          ]),
        ],
      });
    }

    // PARTIAL MATCH
    const { data, error } = await supa
      .from("ablityv2")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true });

    if (error || !data?.length) {
      return sendText(conn, m.chat, config.message.notFound, m);
    }

    // JIKA CUMA 1 HASIL
    if (data.length === 1) {
      const item = data[0];

      let statEffect = item.stat_effect;

      if (isTranslate) {
        statEffect = await translateText(item.stat_effect, "en");
      }

      return conn.sendButton(m.chat, {
        text: `*${item.name}*\n\n${statEffect}`,
        footer: "Neurainc",
        buttons: [
          buildSelectButton("Translate", "Bahasa Yang Tersedia", [
            {
              title: "Bahasa Inggris",
              description: "Ubah ke bahasa Inggris",
              id: `.trait --ing ${item.name}`,
            },
            {
              title: "Bahasa Indonesia",
              description: "Kembali ke bahasa asli",
              id: `.trait ${item.name}`,
            },
            {
              title: "Daftar Trait",
              row: data.map((item) => ({
                title: item.name,
                description: `melihat detail ${item.name}`,
                id: `.trait ${item.name}`,
              })),
            },
          ]),
        ],
      });
    }

    // MULTI RESULT
    return await conn.sendButton(m.chat, {
      text: `Ditemukan *${data.length}* ability untuk: _${query}_\nPilih salah satu:`,
      footer: config.OwnerName,
      buttons: [
        buildSelectButton(
          "Daftar Trait",
          "Silahkan pilih salah satu",
          data.map((item) => ({
            title: item.name,
            description: `Lihat Stat dari ${item.name}`,
            id: `.trait ${item.name}`,
          })),
        ),
      ],
      bottom_sheet: true,
      bottom_name: "Menu Ability",
    });
  } catch (err) {
    console.error("[ability]", err);

    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = "trait";
handler.alias = ["ability"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
