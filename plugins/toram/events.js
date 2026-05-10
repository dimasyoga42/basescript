const handler = (m, { conn }) => {
  try {
    const query = m.text.replace(/\.event/, "").trim();
  } catch (err) {
    console.log(err);
  }
};
