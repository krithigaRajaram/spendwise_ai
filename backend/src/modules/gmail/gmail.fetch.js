import prisma from "../../config/prisma.js";
import { getGmailClient } from "./gmail.service.js";
import { emailQueue } from "../../queues/email.queue.js";
import { detectBankEmail } from "./bankDetector.js";

export const fetchAndStoreEmails = async (userId) => {
  const gmail = await getGmailClient(userId);

  const syncState = await prisma.gmailSyncState.findUnique({
    where: { userId }
  });

  const afterTs = syncState
    ? Math.floor(syncState.lastFetchedAt.getTime() / 1000)
    : null;

  console.log("Fetching Gmail messages after:", afterTs);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: 20,
    q: afterTs ? `after:${afterTs}` : undefined
  });

  const messages = listRes.data.messages || [];
  console.log(`${messages.length} messages received from Gmail`);

  let maxInternalDate = syncState?.lastFetchedAt || null;

  for (const msg of messages) {
    const exists = await prisma.rawEmail.findUnique({
      where: {
        userId_gmailId: { userId, gmailId: msg.id }
      }
    });
    if (exists) continue;

    const fullMsg = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full"
    });

    const message = fullMsg.data;
    const internalDate = new Date(Number(message.internalDate));

    const { isBankCandidate, bankName } = detectBankEmail(message);
    if (!isBankCandidate) continue;

    const raw = await prisma.rawEmail.create({
      data: {
        userId,
        gmailId: message.id,
        threadId: message.threadId,
        payload: message,
        receivedAt: internalDate,
        bankName
      }
    });

    await emailQueue.add("process-email", {
      rawEmailId: raw.id
    });

    console.log("Job enqueued for RawEmail:", raw.id);

    if (!maxInternalDate || internalDate > maxInternalDate) {
      maxInternalDate = internalDate;
    }
  }

  if (maxInternalDate) {
    await prisma.gmailSyncState.upsert({
      where: { userId },
      update: { lastFetchedAt: maxInternalDate },
      create: { userId, lastFetchedAt: maxInternalDate }
    });

    console.log("Gmail sync updated to:", maxInternalDate);
  }
};

export async function fetchGmailMessages(req, res) {
  try {
    const userId = req.userId;
    fetchAndStoreEmails(userId).catch(console.error);
    res.json({ status: "Gmail fetch started" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start fetch" });
  }
}