import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";
import axios from "axios";

const handler = async (m, { conn }) => {
  try {
    const name = m.text.replace(".emot", "").trim();

    if (!name) {
      const { data: list, error } = await supa.from("emot").select("name");

      if (error || !list || list.length === 0) {
        return sendFancyText(conn, m.chat, {
          title: config.BotName,
          body: `Developer By ${config.OwnerName}`,
          thumbnail,
          text: "Daftar emot kosong atau gagal dimuat.",
          quoted: m,
        });
      }

      // batasi jumlah button agar tidak melebihi limit WhatsApp
      const MAX_BUTTONS = 20;
      const limitedList = list.slice(0, MAX_BUTTONS);

      return conn.sendButton(m.chat, {
        text: `Daftar Emot (${limitedList.length}${
          list.length > MAX_BUTTONS ? ` dari ${list.length}` : ""
        })\n- gunakan .emot [nama Emot yang dicari]`,
        footer: config.OwnerName,
        buttons: limitedList.map((item) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: item.name,
            id: `.emot ${item.name}`,
          }),
        })),
        bottom_sheet: true,
        bottom_name: "Daftar emot",
      });
    }

    const { data } = await supa
      .from("emot")
      .select("name, url")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (!data) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    }

    // ─── FETCH IMAGE/GIF/VIDEO ─────────────────────────
    let res;
    try {
      res = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "image/*,video/*,*/*",
        },
        validateStatus: () => true,
      });
      if (res.status !== 200) throw new Error("Bad status");
    } catch {
      const fallback = data.url.replace(
        "raw.githubusercontent.com",
        "cdn.jsdelivr.net/gh",
      );
      res = await axios.get(fallback, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });
    }

    const buffer = Buffer.from(res.data);
    const contentType = (res.headers["content-type"] || "").toLowerCase();
    const url = data.url.toLowerCase();
    const ext = url.split("?")[0].split(".").pop();

    const isGif = contentType.includes("gif") || ext === "gif";
    const isVideo =
      contentType.startsWith("video/") ||
      ["mp4", "webm", "mkv", "mov", "3gp"].includes(ext);
    const isWebp = contentType.includes("webp") || ext === "webp";
    const isImage =
      !isGif &&
      !isVideo &&
      (contentType.startsWith("image/") ||
        ["jpg", "jpeg", "png", "bmp"].includes(ext));

    if (isGif) {
      await conn.sendMessage(
        m.chat,
        {
          video: buffer,
          mimetype: "image/gif",
          gifPlayback: true,
          caption: data.name,
        },
        { quoted: m },
      );
    } else if (isVideo) {
      await conn.sendMessage(
        m.chat,
        {
          video: buffer,
          mimetype: contentType.startsWith("video/")
            ? contentType
            : "video/mp4",
          caption: data.name,
        },
        { quoted: m },
      );
    } else if (isWebp) {
      await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
    } else if (isImage) {
      await conn.sendMessage(
        m.chat,
        { image: buffer, caption: data.name },
        { quoted: m },
      );
    } else {
      await conn.sendMessage(
        m.chat,
        {
          document: buffer,
          mimetype: contentType || "application/octet-stream",
          fileName: `${data.name}.${ext || "bin"}`,
          caption: data.name,
        },
        { quoted: m },
      );
    }
  } catch (err) {
    console.error("emot error:", err.message);
    sendFancyText(conn, m.chat, {
      title: config.BotName,
      body: `Developer By ${config.OwnerName}`,
      thumbnail,
      text: config.message.error,
      quoted: m,
    });
  }
};

handler.command = ["emot"];
handler.category = "Toram Search";
handler.submenu = "Toram";

export default handler;
