# Key concepts that make this work
- Streams: Ordered, append-only log. Like a chat history or event log.
- Consumer Groups: Multiple workers coordinate on one stream without processing the same task twice.
- XACK (acknowledge): "I finished this task, remove it from pending."
- XAUTOCLAIM: Automatic recovery. "If a task hasn't been acked in N milliseconds, give it to me."
- All input data goes in the message object `{ number: String(n) }`. That's the data the worker needs to process.
- Configuration goes to sharable `PROCESS_CONFIG`.
- The producer sends data. The worker reads data from the message and applies configuration rules to it.
