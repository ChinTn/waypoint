// ==========================================
// CRON JOBS — REMOVED
// ==========================================
// Previously this file contained a BullMQ-powered daily deadline reminder
// that ran at 8:00 AM. BullMQ's internal Redis polling consumed ~100k
// commands/day even when idle, which crashed the Upstash free tier.
//
// The deadline reminder feature has been removed for now.
// If needed in the future, use `node-cron` (runs in memory, 0 Redis cost).
