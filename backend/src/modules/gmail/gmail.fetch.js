import prisma from "../../config/prisma.js";
import { getGmailClient } from "./gmail.service.js";
import { emailQueue } from "../../queues/email.queue.js";
import { detectBankEmail } from "./bankDetector.js";

export const fetchAndStoreEmails = async (userId) => {
  const gmail = await getGmailClient(userId);

  const syncState = await prisma.gmailSyncState.findUnique({
    where: { userId }
  });

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const afterTs = syncState
    ? Math.floor(syncState.lastFetchedAt.getTime() / 1000)
    : Math.floor(oneMonthAgo.getTime() / 1000);

  console.log("Fetching Gmail messages after:", afterTs);

  // Paginate through all results
  let messages = [];
  let pageToken = undefined;

  do {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: `after:${afterTs}`,
      ...(pageToken && { pageToken })
    });

    const batch = listRes.data.messages || [];
    messages = messages.concat(batch);
    pageToken = listRes.data.nextPageToken;

    console.log(`Fetched ${batch.length} messages (total: ${messages.length})`);
  } while (pageToken);

  console.log(`${messages.length} total messages received from Gmail`);

  let maxInternalDate = syncState?.lastFetchedAt || null;

  for (const msg of messages) {
    const exists = await prisma.rawEmail.findUnique({
      where: { userId_gmailId: { userId, gmailId: msg.id } }
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

    await emailQueue.add("process-email", { rawEmailId: raw.id });
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
    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    // Start fetch in background, don't await
    fetchAndStoreEmails(userId).catch(err =>
      console.error("Background fetch error:", err)
    );

    res.json({ status: "syncing" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start fetch" });
  }
}