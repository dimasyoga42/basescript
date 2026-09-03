import { downloadMedia, sendText } from "../../../src/config/message.js";
import { getContentType } from "@whiskeysockets/baileys";
import  { lelangStore} from "../../../src/lib/map.js";
import {isAdmin} from "../../_function/_admin.js";
import {selesaikanLelang} from "../../_function/_lelang.js";

const handler = async (m, { conn }) => {
    try {
        if (!(await isAdmin(conn, m))) return;
        const value = m.text.replace(/\.setlelang/i, '').trim();
        if (!value) {
            return sendText(
                conn,
                m.chat,
                "Masukan teks lelang setelah .setlelang\n\nContoh:\n.setlelang Kaos Polos|50000|5\n(nama barang|harga awal|durasi menit)",
                m
            );
        }

        if (lelangStore.get(m.chat)) {
            return sendText(conn, m.chat, "Masih ada lelang yang sedang berjalan di grup ini. Tunggu sampai selesai atau batalkan dulu.", m);
        }

        const [barang, hargaAwalStr, durasiStr] = value.split("|").map(s => s.trim());
        const hargaAwal = parseInt(hargaAwalStr);
        const durasiMenit = parseInt(durasiStr) || 5;

        if (!barang || isNaN(hargaAwal) || hargaAwal <= 0) {
            return sendText(conn, m.chat, "Format salah!\nContoh: .setlelang Kaos Polos|50000|5", m);
        }

        let imageBuffer = null;
        const type = getContentType(m.message);

        if (type === "imageMessage") {
            imageBuffer = await downloadMedia(m, "buffer");
        } else if (m.quoted && getContentType(m.quoted.message) === "imageMessage") {
            imageBuffer = await downloadMedia(m.quoted, "buffer");
        }

        const durasiMs = durasiMenit * 60 * 1000;
        const timer = setTimeout(() => selesaikanLelang(conn, m.chat), durasiMs);

        lelangStore.set(m.chat, {
            barang,
            hargaTertinggi: hargaAwal,
            penawarTertinggi: null,
            starterId: m.sender,
            image: imageBuffer,
            waktuSelesai: Date.now() + durasiMs,
            timer,
        });

        const caption =
            `*LELANG DIMULAI!*\n` +
            `Barang: ${barang}\n` +
            `Harga awal: spina ${hargaAwal.toLocaleString("id-ID")}\n` +
            `Durasi: ${durasiMenit} menit\n\n` +
            `Ketik *.tawar <jumlah>* untuk menawar!`;

        if (imageBuffer) {
            await conn.sendMessage(m.chat, { image: imageBuffer, caption });
        } else {
            await sendText(conn, m.chat, caption, m);
        }
    } catch (error) {
        console.log(error);
    }
};

handler.command = "setlelang";
handler.category = "Menu Jb"
export default handler;