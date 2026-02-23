import { Worker } from "bullmq";
import prisma from "../config/prisma.js";
import { extractEmailBody } from "../utils/email.util.js";
import { parseHdfcEmail } from "../parsers/hdfc.parser.js";

function normalizeMerchant(merchant) {
  if (!merchant) return null;

  return merchant
    .toLowerCase()
    .replace(/@[\w.-]+/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { rawEmailId } = job.data;
    console.log("Job received:", rawEmailId);

    const rawEmail = await prisma.rawEmail.findUnique({
      where: { id: rawEmailId }
    });

    if (!rawEmail) {
      console.warn("RawEmail not found:", rawEmailId);
      return;
    }

    let message = rawEmail.payload;
    if (typeof message === "string") {
      message = JSON.parse(message);
    }

    const gmailPayload = message.payload;
    const emailBody = extractEmailBody(gmailPayload);

    if (!emailBody) {
      console.warn("No email body found:", rawEmailId);
      return;
    }

    if (rawEmail.bankName !== "HDFC") return;

    const parsedTxs = parseHdfcEmail(emailBody);

    if (!parsedTxs.length) {
      console.log("No transactions detected:", rawEmailId);
      return;
    }

    let created = 0;

    for (const tx of parsedTxs) {
      let finalCategory = tx.category || "UNCATEGORIZED";
      let normalizedMerchant = null;

      if (tx.merchant) {
        normalizedMerchant = normalizeMerchant(tx.merchant);

        // Check existing mapping
        const existingMapping = await prisma.merchantCategory.findUnique({
          where: {
            userId_merchantKeyword: {
              userId: rawEmail.userId,
              merchantKeyword: normalizedMerchant
            }
          }
        });

        if (existingMapping) {
          finalCategory = existingMapping.category;
        } else {
          // Auto-learn only if parser already detected category
          if (tx.category && tx.category !== "UNCATEGORIZED") {
            await prisma.merchantCategory.create({
              data: {
                userId: rawEmail.userId,
                merchantKeyword: normalizedMerchant,
                category: tx.category
              }
            });
          }
        }
      }

      await prisma.transaction.create({
        data: {
          userId: rawEmail.userId,
          amount: tx.amount,
          type: tx.type,
          category: finalCategory,
          merchant: normalizedMerchant,
          description: "Auto-imported from HDFC",
          date: tx.date || rawEmail.receivedAt
        }
      });

      created++;
    }

    console.log(`${created} transactions created for RawEmail ${rawEmailId}`);
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null
    }
  }
);

console.log("Email worker started");