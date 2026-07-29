import fs from "fs";

export default class PersonaManager {
  constructor(pathOrData) {
    if (typeof pathOrData === "string") {
      this.path = pathOrData;
      this.inlineData = null;
    } else {
      this.path = null;
      this.inlineData = pathOrData;
    }
  }

  getPersona() {
    if (this.inlineData) return this.inlineData;
    return JSON.parse(fs.readFileSync(this.path, "utf8"));
  }
}
