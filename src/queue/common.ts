// The name of the Redis Stream where all jobs live.
// Think of it as a table in a database.
export const STREAM_KEY = "jobs:prices"
// Consumer group name. 
// This tells Redis: "multiple workers will read from this stream together, and track who processed what."
export const GROUP_NAME = "workers:prices"

// configure processing behavior for each execution.
export const PROCESS_CONFIG = {
    claimIdleMs: 15_000 // claim pending job if idle > 15s
}
