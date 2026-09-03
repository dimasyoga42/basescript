import { sendText } from "../../../src/config/message.js";
import { lelangStore } from "../../../src/lib/map.js"; // sesuaikan path sesuai lokasi lelangStore.js

const handler = async (m, { conn }) => {
    try {
        const lelang = lelangStore.get(m.chat);
        if (!lelang) {
            return sendText(conn, m.chat, "Tidak ada lelang yang sedang berjalan di grup ini.", m);
        }

        const sisaMenit = Math.ceil((lelang.waktuSelesai - Date.now()) / 60000);
        const teks =
            `*STATUS LELANG*\n` +
            `Barang: ${lelang.barang}\n` +
            `Harga tertinggi: Rp${lelang.hargaTertinggi.toLocaleString("id-ID")}\n` +
            `Penawar tertinggi: ${lelang.penawarTertinggi ? "@" + lelang.penawarTertinggi.split("@")[0] : "Belum ada"}\n` +
            `Sisa waktu: ~${sisaMenit} menit`;

        await conn.sendMessage(m.chat, {
            text: teks,
            mentions: lelang.penawarTertinggi ? [lelang.penawarTertinggi] : [],
        });
    } catch (error) {
        console.log(error);
    }
};
handler.command = "statuslelang";
handler.category = "Menu Jb"
export default handler;

