import { getUserData, saveUserData } from "../../../src/config/func.js";
import path from "path";
import { sendFancyText } from "../../../src/config/message.js";
import { config, thumbnail } from "../../../config.js";
import { isAdmin } from "../../_function/_admin.js";

const db = path.resolve("db", "raid.json");
const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const arg = m.text.split(" ");
    const ele = arg[1];
    const price = arg[2];
    const data = await getUserData(db);
    const raidReady = data.find((item) => item.id === m.chat);
    if (raidReady)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `develop by ${config.OwnerName}`,
        thumbnail: thumbnail,
        text: config.message.allready,
        quoted: m,
      });
    const newParty = {
      id: m.chat,
      bos_ele: ele,
      hadiah: price,
      party: {
        pt1: [],
        pt2: [],
        pt3: [],
        pt4: [],
      },
    };
    const mtext =
      `Raid Party\n- Element Bos: ${ele}\n- Hadiah: ${price}\n\n- pt1(0/4)\n- pt2(0/4)\n- pt(0/4)\n- pt4(0/4)`.trim();
    data.push(newParty);
    saveUserData(db, data);
    sendFancyText(conn, m.chat, {
      title: "Party Raid Is Ready",
      body: `use .join ign pt1-pt4`,
      thumbnail,
      text: mtext,
      quoted: m,
    });
  } catch (err) {
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `develop by ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["createraid"];
handler.category = "Toram Raid";
handler.submenu = "Toram";
export default handler;
