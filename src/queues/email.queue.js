import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

export const emailQueue = new Queue(
  process.env.QUEUE_NAME || "email-queue",
  { connection }
);