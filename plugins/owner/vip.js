import path from "path";
import { isOwner } from "../_function/_ban.js";
import { sendText } from "../../src/config/message.js";
import { getUserData, saveUserData } from "../../src/config/func.js";
import { config } from "../../config.js";

const db = path.resolve("db", "vip.json");

const getExp = (days) => {
  const d = parseInt(days, 10);
  if (isNaN(d) || d <= 0 || d > 3650) return null;
  return new Date(Date.now() + d * 86400000).toISOString();
};

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
    if (!isOwner(conn, m)) return;
    const day = m.text.replace(/^\.setvip\s*/i, "").trim();
    if (!day)
      return sendText(
        conn,
        m.chat,
        "Enter number of days\nExample: .setvip 30",
        m,
      );

    const expDate = getExp(day);
    if (!expDate) return sendText(conn, m.chat, "Invalid days (1-3650)", m);

    const data = await getUserData(db);
    const now = new Date().toISOString();
    let user = data.find((e) => e.grubID === m.chat);

    if (!user) {
      data.push({ grubID: m.chat, registered: now, expired: expDate });
    } else {
      user.registered = now;
      user.expired = expDate;
    }

    saveUserData(db, data);
    await sendText(
      conn,
      m.chat,
      `*VIP REGISTERED*\nDuration: ${day} days\nExpired: ${formatDate(expDate)}`,
      m,
    );
  } catch (err) {
    console.error("[setvip]", err);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["setvip"];
handler.category = "Menu Owner";
handler.submenu = "VIP";
export default handler;
