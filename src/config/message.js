import fs from "fs";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const ensure = (v, name) => {
  if (!v) throw new Error(`${name} is required`);
};

const messagetxt = (name) => {
  const CHANNEL = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363401312267152@newsletter",
      newsletterName: `hello ${name}`,
      serverMessageId: 1,
    },
  };

  return CHANNEL;
};

export const sendText = async (sock, jid, text, quoted = null) => {
  ensure(jid, "jid");
  ensure(text, "text");

  await sock.sendMessage(jid, { text }, { quoted });
};

export const editText = async (sock, jid, message, text) => {
  ensure(jid, "jid");
  ensure(text, "text");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 1000));

  await sock.sendMessage(jid, {
    text,
    edit: message.key,
  });

  return await sock.sendPresenceUpdate("paused", jid);
};

export const reactMessage = async (sock, jid, message, emoji) => {
  ensure(jid, "jid");
  ensure(emoji, "emoji");

  return await sock.sendMessage(jid, {
    react: {
      text: emoji,
      key: message.key,
    },
  });
};

export const sendImage = async (
  sock,
  jid,
  image,
  caption = "",
  quoted = null,
) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      image: Buffer.isBuffer(image) ? image : { url: image },
      caption,
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendVideo = async (
  sock,
  jid,
  video,
  caption = "",
  quoted = null,
) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      video: Buffer.isBuffer(video) ? video : { url: video },
      caption,
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendAudio = async (
  sock,
  jid,
  audio,
  ptt = false,
  quoted = null,
) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      audio: Buffer.isBuffer(audio) ? audio : { url: audio },
      ptt,
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendSticker = async (sock, jid, sticker, quoted = null) => {
  ensure(jid, "jid");

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 200));

  await sock.sendMessage(
    jid,
    {
      sticker: Buffer.isBuffer(sticker) ? sticker : { url: sticker },
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendDocument = async (
  sock,
  jid,
  file,
  filename = "file",
  mimetype = "",
  quoted = null,
) => {
  ensure(jid, "jid");

  return await sock.sendMessage(
    jid,
    {
      document: Buffer.isBuffer(file) ? file : { url: file },
      fileName: filename,
      mimetype,
    },
    { quoted },
  );
};

export const sendButton = async (
  sock,
  jid,
  text,
  footer,
  buttons = [],
  quoted = null,
) => {
  ensure(jid, "jid");

  return await sock.sendButton(
    jid,
    {
      text,
      footer,
      buttons,
      headerType: 1,
    },
    { quoted },
  );
};

export const sendList = async (
  sock,
  jid,
  text,
  footer,
  title,
  buttonText,
  sections = [],
  quoted = null,
) => {
  ensure(jid, "jid");

  return await sock.sendMessage(
    jid,
    {
      text,
      footer,
      title,
      buttonText,
      sections,
    },
    { quoted },
  );
};

export const sendFancyText = async (
  sock,
  jid,
  {
    title = "Bot",
    body = "Message",
    text = "",
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  let externalAdReply = {
    title,
    body,
    mediaType: 1,
    previewType: "PHOTO",
    renderLargerThumbnail,
    showAdAttribution: false,
    sourceUrl: "https://whatsapp.com",
    containsAutoReply: true,
  };

  if (thumbnail) {
    if (Buffer.isBuffer(thumbnail)) {
      externalAdReply.thumbnail = thumbnail;
    } else {
      externalAdReply.thumbnailUrl = thumbnail;
    }
  }

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      text,
      contextInfo: {
        externalAdReply,
      },
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendFancyTextModif = async (
  sock,
  jid,
  {
    title = "Bot",
    body = "Message",
    name = "neura",
    text = "",
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  let externalAdReply = {
    title,
    body,
    mediaType: 1,
    previewType: "PHOTO",
    renderLargerThumbnail,
    showAdAttribution: false,
    sourceUrl: "https://whatsapp.com",
    containsAutoReply: true,
  };

  if (thumbnail) {
    if (Buffer.isBuffer(thumbnail)) {
      externalAdReply.thumbnail = thumbnail;
    } else {
      externalAdReply.thumbnailUrl = thumbnail;
    }
  }

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      text,
      contextInfo: {
        externalAdReply,
        ...messagetxt(name),
      },
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const sendMenu = async (
  sock,
  jid,
  {
    title = "Bot",
    body = "Message",
    text = "",
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  let externalAdReply = {
    title,
    body,
    mediaType: 1,
    previewType: "PHOTO",
    renderLargerThumbnail,
    showAdAttribution: false,
    sourceUrl: "https://whatsapp.com",
    containsAutoReply: true,
  };

  if (thumbnail) {
    if (Buffer.isBuffer(thumbnail)) {
      externalAdReply.thumbnail = thumbnail;
    } else {
      externalAdReply.thumbnailUrl = thumbnail;
    }
  }

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendMessage(
    jid,
    {
      text,
      contextInfo: {
        externalAdReply,
      },
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};

export const downloadMedia = async (message, type = "buffer") => {
  const stream = await downloadContentFromMessage(
    message,
    message.mimetype.split("/")[0],
  );

  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  if (type === "buffer") {
    return buffer;
  }

  return fs.writeFileSync("./downloaded_media", buffer);
};

export const sendbtn = () => {};

export const buildSelectButton = (title, sectionTitle, rows) => ({
  name: "single_select",
  buttonParamsJson: JSON.stringify({
    title,
    sections: [
      {
        title: sectionTitle,
        rows,
      },
    ],
  }),
});

export const sendBtns = async (
  sock,
  jid,
  {
    title = "Bot",
    body = "Message",
    text = "",
    footer = "Dimasyoga",
    buttons = [],
    thumbnail = null,
    renderLargerThumbnail = true,
    quoted = null,
  } = {},
) => {
  let externalAdReply = {
    title,
    body,
    mediaType: 1,
    previewType: "PHOTO",
    renderLargerThumbnail,
    showAdAttribution: false,
    sourceUrl: "https://whatsapp.com",
    containsAutoReply: true,
  };

  if (thumbnail) {
    if (Buffer.isBuffer(thumbnail)) {
      externalAdReply.thumbnail = thumbnail;
    } else {
      externalAdReply.thumbnailUrl = thumbnail;
    }
  }

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise((r) => setTimeout(r, 100));

  await sock.sendButton(
    jid,
    {
      text,
      footer,
      buttons,
      headerType: 1,
      contextInfo: {
        externalAdReply,
      },
    },
    { quoted },
  );

  return await sock.sendPresenceUpdate("paused", jid);
};
