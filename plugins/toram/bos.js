import { config, thumbnail } from "../../config.js";
import {
  buildSelectButton,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
import fetch from "node-fetch";
import { formatDetail, parseMonsters } from "./_formater.js";

const BASE_URL = "https://coryn.club";

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");

    const name = arg.slice(1).join(" ").trim();

    if (!name) {
      const { data: db, error } = await supa.from("bosdef").select("name");

      if (error || !db)
        return sendText(conn, m.chat, "bos tidak ditemukan!!", m);

      return await conn.sendButton(m.chat, {
        text: "Pilih Boss yang tersedia",
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.bosdef ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Bosdef",
      });
    }

    const url = `${BASE_URL}/monster.php?name=${encodeURIComponent(name)}&type=&order=id+DESC&show=22`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const utlis = parseMonsters(await res.text());

    const dtail =
      utlis
        .slice(0, 1)
        .map((mob, i) => formatDetail(mob, i, utlis.length))[0] ?? "";

    const { data } = await supa
      .from("bosdef")
      .select("name, type, image_url, spawn, element, stat")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (!data)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });

    const parser =
      `Element:\n${data.element}\nType: ${data.type}\n${dtail}\n\nStat Info:\n${data.stat}`.trim();

    // sendFancyText(conn, m.chat, {
    //   title: data.name,
    //   body: `loc: ${data.spawn}`,
    //   thumbnail: data.image_url,
    //   text: parser,
    //   quoted: m,
    // });
    const { data: db, error } = await supa.from("bosdef").select("name");
    conn.sendButton(m.chat, {
      text: parser,
      footer: "Neura inc",
      buttons: [
        buildSelectButton(
          "Bosdef",
          "Daftar Bos yang tersedia",
          db.map((item) => ({
            title: item.name,
            description: `melihat detail ${item.name}`,
            id: `.bosdef ${item.name}`,
          })),
        ),
      ],
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["bosdef"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
