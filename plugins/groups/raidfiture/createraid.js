import { getUserData, saveUserData } from "../../../src/config/func.js";
import path from "path";
import { sendFancyText, sendText } from "../../../src/config/message.js";
import { config, thumbnail } from "../../../config.js";
import { isAdmin } from "../../_function/_admin.js";

const db = path.resolve("db", "raid.json");
const handler = async (m, { conn }) => {
  try {
    if (!(await isAdmin(conn, m))) return;
    const arg = m.text.split(" ");
    const ele = arg[1];
    const price = arg[2];
    if (!ele || !price) return sendText(conn, m.chat, "gunakan .createraid element bos hadiah, contoh .createraid bumi 50m", m);
    const data = await getUserData(db);
    const raidReady = data.find((item) => item.id === m.chat);
    if (raidReady)
      return await conn.sendMessage(
        m.chat,
        {
          text: "Party Raid sudah di buat harap hapus terlebih dahulu jika ingin membuatnya kembali",

        },
        { quoted: m },
      );

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
    await conn.sendMessage(
      m.chat,
      {
        text: mtext,
      },
      { quoted: m },
    );
  } catch (err) {
    sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["createraid"];
handler.category = "Toram Raid";
handler.submenu = "Toram";
export default handler;
