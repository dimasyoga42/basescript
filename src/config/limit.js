import { supa } from "./supa.js";

const DAILY_LIMIT = 100;

export const checkGroupLimit = async (groupId) => {
  const today = new Date().toISOString().slice(0, 10);

  let { data } = await supa
    .from("group_limit")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!data) {
    const { data: newData } = await supa
      .from("group_limit")
      .insert({
        id: groupId,
        limit: DAILY_LIMIT,
        last_reset: today,
        is_premium: false,
      })
      .select()
      .single();

    data = newData;
  }

  if (data.last_reset !== today) {
    await supa
      .from("group_limit")
      .update({
        limit: DAILY_LIMIT,
        last_reset: today,
      })
      .eq("id", groupId);

    data.limit = DAILY_LIMIT;
  }

  if (data.is_premium) {
    return { ok: true, remaining: "unlimited" };
  }

  if (data.limit <= 0) {
    return { ok: false, remaining: 0 };
  }

  await supa
    .from("group_limit")
    .update({ limit: data.limit - 1 })
    .eq("id", groupId);

  return { ok: true, remaining: data.limit - 1 };
};
