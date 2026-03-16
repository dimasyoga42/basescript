import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { runCommand } from "./handler.js";
import { loadPlugins, plugins } from "./plugins/index.js";
import dotenv from "dotenv";
import { checkMentionAfk, checkUnAfk } from "./plugins/_function/_afk.js";
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

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const m = messages[0];
    if (!m?.message) return;

    try {
      const text =
        m.message.conversation || m.message.extendedTextMessage?.text || "";

      m.text = text;
      m.chat = m.key.remoteJid;
      m.sender = m.key.participant || m.key.remoteJid;

      await runCommand(sock, m, plugins);
      checkMentionAfk(sock, m.chat, m);
      checkUnAfk(sock, m.chat, m);
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
