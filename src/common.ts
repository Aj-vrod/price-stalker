// The name of the Redis Stream where all jobs live.
// Think of it as a table in a database.
export const STREAM_KEY = "jobs:numbers"
// Consumer group name. 
// This tells Redis: "multiple workers will read from this stream together, and track who processed what."
export const GROUP_NAME = "workers:numbers"

// configure processing behavior for each execution.
export const PROCESS_CONFIG = {
    add: 10,
    multiply: 2,
    claimIdleMs: 15_000 // claim pending job if idle > 15s
}
