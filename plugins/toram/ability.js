// EXACT MATCH
const { data: exactData, error: exactError } = await supa
  .from("ablityv2")
  .select("*")
  .ilike("name", query)
  .limit(1);

if (!exactError && exactData?.length === 1) {
  const item = exactData[0];

  let statEffect = item.stat_effect;

  if (isTranslate) {
    statEffect = await translateText(item.stat_effect, "en");
  }

  return await editText(conn, m.chat, m, `*${item.name}*\n\n${statEffect}`);
}

// PARTIAL MATCH
const { data, error } = await supa
  .from("ablityv2")
  .select("*")
  .ilike("name", `%${query}%`)
  .order("name", { ascending: true });

if (error || !data?.length) {
  return sendText(conn, m.chat, config.message.notFound, m);
}

// JIKA CUMA 1 HASIL
if (data.length === 1) {
  const item = data[0];

  let statEffect = item.stat_effect;

  if (isTranslate) {
    statEffect = await translateText(item.stat_effect, "en");
  }

  return await editText(conn, m.chat, m, `*${item.name}*\n\n${statEffect}`);
}
