import { emailQueue } from "../queues/email.queue.js";

export const enqueueTestJob = async (req, res) => {
  const job = await emailQueue.add("test-email-job", {
    source: "api",
    message: "Hello from API queue",
  });

  res.json({
    message: "Job enqueued",
    jobId: job.id,
  });
};