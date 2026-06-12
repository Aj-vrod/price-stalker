import { redisClient } from './queue'
import { STREAM_KEY } from './common'

export async function enqueue(url: string) {
    try {
        const client = redisClient()
        // Opens the TCP connection to Redis.
        await client.connect()

        // Adds a new entry to the Redis Stream.
        const id = await client.xAdd(
            // which stream to add to
            STREAM_KEY,
            // auto-generate the entry ID (timestamp-based)
            '*', 
            // the actual data (the number to process)
            {
                url,
            }
        )
        // The result is an ID like "1634567890123-0" — this is how Redis uniquely identifies each task

        console.log(`Enqueued entry with id=${id}`)
        await client.quit()
    } catch (error) {
        console.error(error);
        process.exit(1);   
    }
}
