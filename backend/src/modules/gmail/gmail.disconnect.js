import prisma from "../../config/prisma.js";
import { emailQueue } from "../../queues/email.queue.js";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export const disconnectGmail = async (req, res) => {
  try {
    const userId = req.userId;

    const token = await prisma.gmailToken.findUnique({ where: { userId } });
    if (!token) {
      return res.status(400).json({ error: "Gmail is not connected" });
    }

    await prisma.gmailToken.delete({ where: { userId } });

    await prisma.gmailSyncState.upsert({
      where: { userId },
      update: {
        disconnectedAt: new Date(),
        oneMonthWarningSent: false,
        twoMonthWarningSent: false
      },
      create: {
        userId,
        lastFetchedAt: new Date(),
        disconnectedAt: new Date(),
        oneMonthWarningSent: false,
        twoMonthWarningSent: false
      }
    });

    // Schedule delayed jobs
    await emailQueue.add(
      "inactivity-warning",
      { userId, type: "one_month_warning" },
      { delay: ONE_MONTH_MS, jobId: `inactivity-1m-${userId}` }
    );
    await emailQueue.add(
      "inactivity-warning",
      { userId, type: "two_month_warning" },
      { delay: TWO_MONTHS_MS, jobId: `inactivity-2m-${userId}` }
    );
    await emailQueue.add(
      "inactivity-delete",
      { userId },
      { delay: THREE_MONTHS_MS, jobId: `inactivity-delete-${userId}` }
    );

    console.log(`Inactivity jobs scheduled for userId ${userId}`);
    res.json({ message: "Gmail disconnected successfully" });
  } catch (err) {
    console.error("Gmail disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
};