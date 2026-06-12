import {
    GROUP_NAME,
    PROCESS_CONFIG,
    STREAM_KEY,
} from "./common";
import { redisClient } from "./queue";

type StreamEntry = {
    id: string,
    message: Record<string, string>
}

// Unique identifier for this worker
// Redis uses this to know which worker processed a task.
const consumerName = process.argv[2] ?? `worker-${process.pid}`;

// Tries to create a consumer group
// This group tracks which worker has claimed which task and prevents duplicate processing
async function ensureGroup(client: ReturnType<typeof redisClient>) {
    try {
        await client.xGroupCreate(STREAM_KEY, GROUP_NAME, "0", {MKSTREAM: true})
        console.log("Consumer group created")
    } catch (error: any) {
        // If error is not BUSYGROUP (means group already exists)
        if (!String(error?.message).includes("BUSYGROUP")) throw error
    }
}

// This does the actual operations on an item
function processNumber(raw: string) {
    const n = Number(raw)
    console.log(`[${consumerName}] input: ${n}`)
    const result = (n + PROCESS_CONFIG.add) * PROCESS_CONFIG.multiply
    console.log(`[${consumerName}] result: ${result}`);
}

async function handleEntry(
    client: ReturnType<typeof redisClient>,
    entry: StreamEntry
) {
    // Extracts the number from the task message
    const raw = entry.message.number
    if (!raw) {
        await client.xAck(STREAM_KEY, GROUP_NAME, entry.id)
        return
    }

    try {
        // Executes the work
        processNumber(raw)
        // Critical: If successful, calls xAck() to tell Redis "this task is done, mark it complete"
        await client.xAck(STREAM_KEY, GROUP_NAME, entry.id)
    } catch (error) {
        console.error(`[${consumerName}] failed id=${entry.id}`, error);
        // No ack -> stays pending for retry/claim
    }
}

// Calls xReadGroup() to fetch new unread tasks
async function readNew(client: ReturnType<typeof redisClient>) {
    // Fetches new unread tasks
    const response = await client.xReadGroup(
        GROUP_NAME,
        consumerName,
        [{ 
            key: STREAM_KEY,
            // means "give me entries I haven't read yet")
            id: ">"}],
        { 
            // grab up to 10 tasks per read
            COUNT: 10,
            // if no tasks, wait 3 seconds (don't hammer Redis)
            BLOCK: 3000 }
    )

    if (!response) return

    for (const stream of response) {
        for (const m of stream.messages) {
            // For each task, starts processing
            await handleEntry(client, { id: m.id, message: m.message as Record<string,string> })
        }
    }
}

// Claim old pending messages that another worker did not finish
async function claimPending(client: ReturnType<typeof redisClient>) {
    // Find tasks that have been pending (idle) for > 15 seconds
    // These are tasks another worker claimed but never acknowledged
    const result = await client.xAutoClaim(
        STREAM_KEY,
        GROUP_NAME,
        consumerName,
        PROCESS_CONFIG.claimIdleMs,
        "0-0",
        { COUNT: 10 }
    )

    // adopts those tasks and processes them again
    const { messages } = result;
    for (const m of messages) {
        if (!m) {
            return
        }
        await handleEntry(client, { id: m.id, message: m.message as Record<string, string> });
    }
}

export async function runWorker() {
    try {
        const client = redisClient()
        await client.connect()
        await ensureGroup(client)

        console.log(`Worker started: ${consumerName}`);

        while(true) {
            await readNew(client)
            await claimPending(client)
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
