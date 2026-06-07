# Important when scaling
1. If you need NEW input fields (e.g., a second number to process together):
    - Change the producer to add more fields to the message
    - Extract them in handleEntry before calling processNumber
2. If you need to configure the new tasks (e.g., different multipliers per step):
    - Add them to PROCESS_CONFIG in common.ts
3. If the new tasks need special error handling:
    - Modify handleEntry's try/catch logic
4. Leverage BullMQ (full framework). BullMQ has built-in round-robin and fairness. Worth it if you scale.
