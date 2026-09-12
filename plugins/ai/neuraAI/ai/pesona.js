import fs from "fs";

export default class PersonaManager {
  constructor(pathOrData) {
    if (typeof pathOrData === "string") {
      this.path = pathOrData;
      this.inlineData = null;
      this._cache = null;
    } else {
      this.path = null;
      this.inlineData = pathOrData;
    }
  }

  getPersona() {
    if (this.inlineData) return this.inlineData;

    // [OPTIMASI] Kalau persona dari file, baca+parse cuma sekali lalu
    // di-cache. Sebelumnya file dibaca ulang dari disk setiap kali
    // getPersona() dipanggil (yaitu tiap pesan masuk).
    if (this._cache) return this._cache;

    this._cache = JSON.parse(fs.readFileSync(this.path, "utf8"));
    return this._cache;
  }
}
