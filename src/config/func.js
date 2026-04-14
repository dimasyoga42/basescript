import fs from "fs";

export const getUserData = async (file) => {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "[]");
      return [];
    }

    const raw = fs.readFileSync(file, "utf-8");

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (err) {
    console.error("Gagal membaca file:", err);
    return [];
  }
};

export const saveUserData = async (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Gagal menyimpan file:", err);
  }
};
