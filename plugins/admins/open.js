import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { isAdmin, isBotadmin } from "../_function/_admin.js";

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    if (!(await isBotadmin(conn, m))) return;
    conn.groupSettingUpdate(m.chat, "not_announcement");
    sendText(conn, m.chat, "Groups Open", m);
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail: thumbnail,
      m,
    });
  }
};

handler.command = "ogc";
handler.alias = ["open", "buka"];
handler.category = "Menu Admin";
handler.submenu = "Admin";

export default handler;
