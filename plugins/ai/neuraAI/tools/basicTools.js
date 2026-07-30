export function currentTime() {
  return new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function safeCalc(expr) {
  const sanitized = String(expr || "").replace(/[^0-9+\-*/().,\s%]/g, "");
  if (!sanitized.trim()) return "gak ada yang bisa dihitung tuh";
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized.replace(/%/g, "/100")});`)();
    if (typeof result !== "number" || !isFinite(result)) {
      return "hasilnya error, coba cek lagi rumusnya";
    }
    return String(Math.round(result * 10000) / 10000);
  } catch {
    return "hasilnya error, coba cek lagi rumusnya";
  }
}
