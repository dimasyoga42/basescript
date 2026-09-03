import {lelangStore} from "../../src/lib/map.js";

export async function selesaikanLelang(conn, chat) {
    const lelang = lelangStore.get(chat);
    if (!lelang) return;

    let teks;
    const mentions = [];

    if (lelang.penawarTertinggi) {
        teks =
            `*LELANG SELESAI*\n` +
            `Barang: ${lelang.barang}\n` +
            `Pemenang: @${lelang.penawarTertinggi.split("@")[0]}\n` +
            `Harga akhir: spina ${lelang.hargaTertinggi.toLocaleString("id-ID")}`;
        mentions.push(lelang.penawarTertinggi);
    } else {
        teks =
            `*LELANG SELESAI*\n\n` +
            `Barang: ${lelang.barang}\n` +
            `Tidak ada penawar. Lelang dibatalkan.`;
    }

    await conn.sendMessage(chat, { text: teks, mentions });
    lelangStore.delete(chat);
}