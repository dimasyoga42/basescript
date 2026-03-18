import path from "path";
import { getUserData } from "../../src/config/func.js";
import { sendText } from "../../src/config/message.js";
import { config } from "../../config.js";

const db = path.resolve("db", "vip.json");

const formatDate = (str) =>
  new Date(str).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const handler = async (m, { conn }) => {
  try {
    const data = await getUserData(db);
    const user = data.find((e) => e.grubID === m.chat);

    if (!user) return sendText(conn, m.chat, "This group is not VIP", m);

    if (new Date(user.expired) < new Date()) {
      await saveUserData(
        db,
        data.filter((e) => e.grubID !== m.chat),
      );
      return sendText(conn, m.chat, "VIP has expired", m);
    }

    await sendText(
      conn,
      m.chat,
      `*VIP STATUS*\nStatus: Active\nExpired: ${formatDate(user.expired)}`,
      m,
    );
  } catch (err) {
    console.error("[cekvip]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["cekvip", "vipstatus"];
handler.category = "Menu Grub";
handler.submenu = "VIP";
export default handler;
