import { config, thumbnail } from "../../config.js";
import {
  buildSelectButton,
  sendFancyText,
  sendText,
} from "../../src/config/message.js";

const REGIS_API_URL = "https://server.neurasama.my.id/etc/toram/regis";

const fetchRegisData = async (name) => {
  try {
    const url = name
      ? `${REGIS_API_URL}?name=${encodeURIComponent(name)}`
      : REGIS_API_URL;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Request gagal dengan status ${res.status}`);
    }
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    console.error("[regis] fetchRegisData error:", err);
    throw err;
  }
};

const handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      let allData;
      try {
        allData = await fetchRegisData();
      } catch (err) {
        return conn.sendMessage(
          m.chat,
          { text: "Gagal mengambil data dari server." },
          { quoted: m },
        );
      }
      if (!allData?.length) {
        return conn.sendMessage(
          m.chat,
          { text: "Gagal mengambil data dari server." },
          { quoted: m },
        );
      }
      return conn.sendButton(m.chat, {
        text: "Daftar Seluruh regist\n- gunakan .regis [nama regis yang dicari]",
        footer: config.OwnerName,
        buttons: allData.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.regist ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar Regist",
      });
    }

    let data;
    try {
      data = await fetchRegisData(text);
    } catch (err) {
      return sendText(
        conn,
        m.chat,
        "terjadi kesalahan pada server harap di ulang",
        m,
      );
    }

    if (!data || data.length === 0) {
      return sendText(
        conn,
        m.chat,
        `pencarian untuk ${text} tidak ditemukan, atau ada kesalahan pada sistem`,
        m,
      );
    }

    const mtext = data
      .map(
        (item) =>
          `*${item.name}*\nDeskripsi:\n${item.effect}\n\nMax Level:\n- ${item.max_lv}\nLevel:\n- ${item.levels_studied}\n`,
      )
      .join("\n");
    await sendText(conn, m.chat, mtext, m);
  } catch (err) {
    console.error("[regis] Error:", err);
    sendText(conn, m.chat, "terjadi kesalahan pada server harap di ulang", m);
  }
};
handler.command = "regis";
handler.alias = ["regist"];
handler.category = "Toram Search";
handler.submenu = "Toram";
export default handler;
