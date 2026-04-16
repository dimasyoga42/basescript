import { createClient } from "redis";

export const client = createClient();
client.on("err", (err) => console.log("redis error" + err));

const run = async () {
  await client.connect()
}

run()
