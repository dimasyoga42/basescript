import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
  proto,
  generateWAMessageFromContent,
  jidDecode,
  downloadContentFromMessage,
  prepareWAMessageMedia,
  generateMessageID,
  generateWAMessage,
} from "@ryuu-reinzz/baileys";
import haruka from "@ryuu-reinzz/haruka-lib";
const property = {
  proto,
  generateWAMessageFromContent,
  jidDecode,
  downloadContentFromMessage,
  prepareWAMessageMedia,
  generateMessageID,
  generateWAMessage,
};
import qrcode from "qrcode-terminal";
import { runCommand, runEvent } from "./handler.js";
import { loadPlugins, plugins } from "./plugins/index.js";
import dotenv from "dotenv";
import { checkMentionAfk, checkUnAfk } from "./plugins/_function/_afk.js";
import { jawab } from "./plugins/fun/game.js";
import { messageHandler } from "./plugins/ai/neura.js";
dotenv.config();
const start = async () => {
  // Load semua plugin dulu sebelum bot jalan
  await loadPlugins();
  console.log(`Plugin dimuat: ${Object.keys(plugins).length} plugin`);

  const { state, saveCreds } = await useMultiFileAuthState("./auth_save");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });
  haruka.addProperty(sock, property);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("group-participants.update", async (event) => {
    await runEvent(
      sock,
      { ...event, type: "group_participants_update" },
      plugins,
    );
  });
  const extractText = (m) => {
    const msg = m.message;
    if (!msg) return "";

    // Coba interactiveResponseMessage dulu
    try {
      const params = JSON.parse(
        msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
          "{}",
      );
      if (params.id) return params.id;
    } catch {}

    return (
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      msg.videoMessage?.caption ||
      msg.buttonsResponseMessage?.selectedButtonId ||
      msg.buttonsResponseMessage?.selectedDisplayText ||
      msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.templateButtonReplyMessage?.selectedId ||
      ""
    );
  };
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const m = messages[0];
    console.log(m)
    //console.log(m);
    if (!m?.message) return;

    try {
      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        "";

      m.text = extractText(m);
      m.chat = m.key.remoteJid;
      m.sender = m.key.participant || m.key.remoteJid;
      const isAfkCommand = m.text?.trim().toLowerCase().startsWith(".afk");
      if (!isAfkCommand) {
        await checkUnAfk(sock, m.chat, m);
        await checkMentionAfk(sock, m.chat, m);
      }
      await jawab(sock, m);
      await messageHandler(sock, m.chat, m);
      await runCommand(sock, m, plugins);
    } catch (err) {
      console.error("Error saat memproses pesan:", err);
    }
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    try {
      if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("Scan QR untuk login WhatsApp");
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        console.log("Koneksi terputus. Reconnect?", shouldReconnect);

        if (shouldReconnect) {
          console.log("Reconnect dalam 5 detik...");
          setTimeout(start, 5000);
        } else {
          console.log(
            "Logout permanen. Hapus folder auth_save untuk login ulang.",
          );
        }
      }

      if (connection === "open") {
        console.log("Bot WhatsApp berhasil terhubung!");
      }
    } catch (err) {
      console.error("Error connection.update:", err);
      setTimeout(start, 5000);
    }
  });
};

start();
