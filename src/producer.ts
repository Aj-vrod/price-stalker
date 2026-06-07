import { redisClient } from './queue'
import { STREAM_KEY } from './common'

async function main() {
    const client = redisClient()
    // Opens the TCP connection to Redis.
    await client.connect()
    const numbers = [3,7,11,20]

    for (const n of numbers ) {
        // Adds a new entry to the Redis Stream.
        const id = await client.xAdd(
            // which stream to add to
            STREAM_KEY,
            // auto-generate the entry ID (timestamp-based)
            '*', 
            // the actual data (the number to process)
            { number: String(n) }
        )
        // The result is an ID like "1634567890123-0" — this is how Redis uniquely identifies each task

        console.log(`Enqueued number=${n} id=${id}`)
    }
    await client.quit()
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
