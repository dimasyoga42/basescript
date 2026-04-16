import { createClient } from "redis";

export const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

client.on("connect", () => {
  console.log("Redis connecting...");
});

client.on("ready", () => {
  console.log("Redis ready");
});

client.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

client.on("end", () => {
  console.log("Redis disconnected");
});

const connectRedis = async () => {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
};

await connectRedis();
