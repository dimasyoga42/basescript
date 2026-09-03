import { sendText } from "../../../src/config/message.js";
import { lelangStore } from "../../../src/lib/map.js"; // sesuaikan path sesuai lokasi lelangStore.js

const handler = async (m, { conn }) => {
    try {
        const value = m.text.replace(/\.tawar/i, '').trim();

        const lelang = lelangStore.get(m.chat);
        if (!lelang) {
            return sendText(conn, m.chat, "Tidak ada lelang yang sedang berjalan di grup ini.", m);
        }

        const jumlah = parseInt(value);
        if (!value || isNaN(jumlah) || jumlah <= 0) {
            return sendText(conn, m.chat, "Masukan jumlah tawaran yang valid.\nContoh: .tawar 75000", m);
        }

        if (jumlah <= lelang.hargaTertinggi) {
            return sendText(
                conn,
                m.chat,
                `Tawaran harus lebih tinggi dari spina ${lelang.hargaTertinggi.toLocaleString("id-ID")}`,
                m
            );
        }

        if (m.sender === lelang.penawarTertinggi) {
            return sendText(conn, m.chat, "Kamu sudah jadi penawar tertinggi saat ini.", m);
        }

        lelang.hargaTertinggi = jumlah;
        lelang.penawarTertinggi = m.sender;

        const sisaMenit = Math.ceil((lelang.waktuSelesai - Date.now()) / 60000);

        await conn.sendMessage(m.chat, {
            text: `Tawaran diterima!\n@${m.sender.split("@")[0]} menawar spina ${jumlah.toLocaleString("id-ID")}\nSisa waktu: ~${sisaMenit} menit`,
            mentions: [m.sender],
        });
    } catch (error) {
        console.log(error);
    }
};


handler.command = "tawar";
handler.category = "Menu Jb"
export default handler;