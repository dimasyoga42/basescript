import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const arg = m.text.split(" ");
    const name = arg[1];
    if (!name)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound,
        quoted: m,
      });
    if (name === "--all") {
      const { data: db, err: errdb } = await supa
        .from("hdb")
        .select("bossname");

      return await conn.sendButton(m.chat, {
        text: `Pilih salah satu:`,
        footer: config.OwnerName,
        buttons: db.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.hdb ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "List Ability",
      });
    }
    const { data } = await supa
      .from("hdb")
      .select("bosname, stat")
      .ilike("bosname", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (!data)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.notFound,
        quoted: m,
      });
    sendFancyText(conn, m.chat, {
      title: data.bosname,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: data.stat,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};
handler.command = ["hdb"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
