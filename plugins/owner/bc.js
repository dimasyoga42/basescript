import fs from "fs";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { config, thumbnail } from "../../config.js";
import { sendFancyText, sendText } from "../../src/config/message.js";
import { isOwner } from "../_function/_ban.js";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const getAllGroups = async (conn) => {
  try {
    const groups = await conn.groupFetchAllParticipating();
    return Object.keys(groups);
  } catch (err) {
    console.error("[bc] Gagal fetch grup:", err.message);
    return [];
  }
};

const getMedia = (m) => {
  if (m.message?.imageMessage) return m;
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  return quoted?.imageMessage ? { message: quoted } : null;
};

const bcGroups = async (conn, payload) => {
  const groupJids = await getAllGroups(conn);
  if (!groupJids.length) return { total: 0, success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  console.log(`[bc] Broadcast ke ${groupJids.length} grup...`);

  for (let i = 0; i < groupJids.length; i++) {
    const jid = groupJids[i];
    try {
      const message = {};

      if (payload.image) {
        message.image = Buffer.isBuffer(payload.image)
          ? payload.image
          : typeof payload.image === "string" &&
              payload.image.startsWith("http")
            ? { url: payload.image }
            : fs.readFileSync(payload.image);
        message.caption = payload.text || "";
      } else if (payload.text) {
        message.text = payload.text;
      }

      // forward quoted message jika ada
      if (payload.quoted) {
        await conn.sendMessage(jid, message, { quoted: payload.quoted });
      } else {
        await conn.sendMessage(jid, message);
      }

      success++;
      console.log(`[bc] [${i + 1}/${groupJids.length}] ✅ ${jid}`);
    } catch (err) {
      failed++;
      console.error(
        `[bc] [${i + 1}/${groupJids.length}] ❌ ${jid}:`,
        err.message,
      );
    }

    // delay antar pesan agar tidak kena spam
    if (i < groupJids.length - 1) await delay(1500);
  }

  return { total: groupJids.length, success, failed };
};

const handler = async (m, { conn }) => {
  try {
    // hanya owner yang bisa broadcast
    if (!isOwner(conn, m)) return;

    const text = m.text.replace(/^\.bc\s*/i, "").trim();
    const mediaMsg = getMedia(m);
    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      ? { message: m.message.extendedTextMessage.contextInfo.quotedMessage }
      : null;

    if (!text && !mediaMsg && !quotedMsg)
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: "Gunakan:\n.bc <teks>\nReply gambar + .bc <caption>\nReply pesan + .bc",
        msg: m,
      });

    await sendText(conn, m.chat, "📡 Broadcast dimulai...", m);

    let result;

    // IMAGE broadcast
    if (mediaMsg) {
      const buffer = await downloadMediaMessage(
        mediaMsg,
        "buffer",
        {},
        { reuploadRequest: conn.updateMediaMessage },
      );
      result = await bcGroups(conn, { image: buffer, text });
    }
    // QUOTED MESSAGE broadcast
    else if (quotedMsg) {
      result = await bcGroups(conn, { quoted: quotedMsg, text });
    }
    // TEXT ONLY broadcast
    else {
      result = await bcGroups(conn, { text });
    }

    await sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: `Broadcast Selesai\n\nTotal  : ${result.total} grup\nBerhasil: ${result.success}\nGagal  : ${result.failed}`,
      msg: m,
    });
  } catch (err) {
    console.error("[bc]", err.message);
    await sendText(conn, m.chat, config.message.error, m);
  }
};

handler.command = ["bc"];
handler.category = "Menu Owner";
handler.submenu = "Owner";
export default handler;
