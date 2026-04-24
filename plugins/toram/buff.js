import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.split(/\s+/)[1]?.trim();

    if (!name) {
      const { data } = await supa.from("buff").select("name, code");
      const mtext = data
        .map((item) => `\n*${item.name}*\n${item.code}\n`)
        .join("\n────────────\n");

      // return sendFancyText(conn, m.chat, {
      //   title: config.BotName,
      //   body: `Develop by ${config.OwnerName}`,
      //   thumbnail,
      //   text: mtext,
      //   quoted: m,
      // });
      return await conn.sendButton(m.chat, {
        text: mtext,
        footer: config.OwnerName,
        buttons: data.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.buff ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar Buff",
      });
    }

    const { data } = await supa
      .from("buff")
      .select("name, code")
      .ilike("name", `%${name}%`);

    if (!data || data.length === 0)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Develop by ${config.OwnerName}`,
        thumbnail,
        text: `Buff "${name}" tidak ditemukan`,
        msg: m,
      });

    const mtext = data
      .map((item) => `\n*${item.name}*\n${item.code}\n`)
      .join("\n\n────────────");

    // await sendFancyText(conn, m.chat, {
    //   title: config.BotName,
    //   body: `Develop by ${config.OwnerName}`,
    //   thumbnail,
    //   text: mtext,
    //   quoted: m,
    // });
    return await conn.sendButton(m.chat, {
      text: mtext,
      footer: config.OwnerName,
      buttons: data.map((item) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: item.name,
          id: `.buff ${item.name}`,
        }),
      })),
      bottom_sheet: true,
      bottom_name: "Daftar Buff",
    });
  } catch (err) {
    console.error(err);
    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Develop by ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["buff"];
handler.category = "Menu Toram";
handler.submenu = "Toram";
export default handler;
