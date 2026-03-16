import path from "path";
import { isAdmin } from "../_function/_admin.js";
import { sendFancyText } from "../../src/config/message.js";
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
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: "exemple: .warn @user",
        thumbnail,
        text: config.message.invalid,
        msg: m,
      });

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

    if (member.warn >= 10) {
      await conn.groupParticipantsUpdate(m.chat, [target], "remove");
      group.members = group.members.filter((u) => u.id !== target);
      saveUserData(db, data);
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: `User mencapai 10 warn dan telah dikeluarkan dari grup.`,
        msg: m,
      });
    }

    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: `User berhasil diberi peringatan.\nTotal warn: *${member.warn}/10*`,
      msg: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      msg: m,
    });
  }
};

handler.command = ["warn"];
handler.category = "Menu Admin";
handler.submenu = "Admin";
export default handler;
