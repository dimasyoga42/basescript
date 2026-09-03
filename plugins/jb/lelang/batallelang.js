import { sendText } from "../../../src/config/message.js";
import { lelangStore } from "../../../src/lib/lelangStore.js"; // sesuaikan path sesuai lokasi lelangStore.js

const handler = async (m, { conn }) => {
    try {
        const lelang = lelangStore.get(m.chat);
        if (!lelang) {
            return sendText(conn, m.chat, "Tidak ada lelang yang sedang berjalan di grup ini.", m);
        }

        if (m.sender !== lelang.starterId) {
            return sendText(conn, m.chat, "Hanya yang memulai lelang yang bisa membatalkannya.", m);
        }

        clearTimeout(lelang.timer);
        lelangStore.delete(m.chat);

        return sendText(conn, m.chat, `Lelang "${lelang.barang}" telah dibatalkan.`, m);
    } catch (error) {
        console.log(error);
    }
};

handler.command = "batallelang";
handler.category = "Menu Jb"
export default handler;
