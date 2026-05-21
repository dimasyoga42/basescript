import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { config, thumbnail } from "../../config.js";
import { getUserData, saveUserData } from "../../src/config/func.js";

const db = path.resolve("db", "warn.json");

const getGroup = (data, groupId) => {
  let group = data.find((g) => g.id === groupId);
  if (!group) {
    group = { id: groupId, members: [] };
    data.push(group);
  }
  return group;
};

const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;

    const mention =
      m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    if (mention.length === 0)
      return sendText(conn, m.chat, "format salah gunakan .warn @tag", m);

    const target = mention[0];
    const data = getUserData(db);
    const group = getGroup(data, m.chat);

    let member = group.members.find((u) => u.id === target);
    if (!member) {
      member = { id: target, warn: 1 };
      group.members.push(member);
    } else {
      member.warn += 1;
    }

    saveUserData(db, data);

    if (member.warn >= 4) {
      await conn.groupParticipantsUpdate(m.chat, [target], "remove");
      group.members = group.members.filter((u) => u.id !== target);
      saveUserData(db, data);
      return sendText(
        conn,
        m.chat,
        "user telah dapat peringatan 4 kali, dan wajib di kick",
        m,
      );
    }

    sendText(conn, m.chat, "user berasil di warn cek dengan .listwarn", m);
  } catch (err) {
    sendText(conn, m.chat, "terjadi kesalahan pada server", m);
  }
};

handler.command = "warn";
handler.alias = ["w"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
