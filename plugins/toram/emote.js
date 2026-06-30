import { config, thumbnail } from "../../config.js";
import { sendFancyText } from "../../src/config/message.js";
import { supa } from "../../src/config/supa.js";

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

      return conn.sendButton(m.chat, {
        text: `Daftar Emot (${list.length})\n- gunakan .emot [nama Emot yang dicari]`,
        footer: config.OwnerName,
        buttons: list.map((item) => ({
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
    console.log(data);

    if (!data) {
      return sendFancyText(conn, m.chat, {
        title: config.BotName,
        body: `Developer By ${config.OwnerName}`,
        thumbnail,
        text: config.message.notFound ?? "Data tidak ditemukan.",
        quoted: m,
      });
    }

    const url = data.url;
    const ext = url.toLowerCase().split("?")[0].split(".").pop();

    const isGif = ext === "gif";
    const isVideo = ["mp4", "webm", "mkv", "mov", "3gp"].includes(ext);
    const isWebp = ext === "webp";

    if (isGif) {
      await conn.sendMessage(
        m.chat,
        {
          video: { url },
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
          video: { url },
          caption: data.name,
        },
        { quoted: m },
      );
    } else if (isWebp) {
      await conn.sendMessage(
        m.chat,
        {
          sticker: { url },
        },
        { quoted: m },
      );
    } else {
      await conn.sendMessage(
        m.chat,
        {
          image: { url },
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
