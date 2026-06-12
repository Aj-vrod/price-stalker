import { createClient } from "redis";

export function redisClient() {
    const client = createClient({ url: process.env.REDIS_URL })
    client.on("error", (err) => console.error("Redis error: ", err))

    return client
}
