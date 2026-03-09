import { Worker } from "bullmq";
import prisma from "../config/prisma.js";
import { extractEmailBody } from "../utils/email.util.js";
import { parseHdfcEmail } from "../parsers/hdfc.parser.js";
import { parseWithAI } from "../parsers/ai.parser.js";

function normalizeMerchant(merchant) {
  if (!merchant) return null;

  return merchant
    .toLowerCase()
    .replace(/@[\w.-]+/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 2000);
}

const worker = new Worker(
  "email-queue",
  async (job) => {
    try {
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

      const cleanBody = cleanHtml(emailBody);
      console.log("Clean email body sent to AI:", cleanBody);

      let parsedTxs = [];

      try {
        const aiResult = await parseWithAI(cleanBody);
        console.log("AI result:", JSON.stringify(aiResult));
        parsedTxs = [{ ...aiResult, source: "AI" }];
        console.log("AI parsing succeeded");
      } catch (err) {
        console.warn("AI parsing failed, falling back to regex:", err.message);
        parsedTxs = parseHdfcEmail(emailBody).map(tx => ({ ...tx, source: "REGEX" }));
      }

      if (!parsedTxs.length) {
        console.log("No transactions detected:", rawEmailId);
        return;
      }

      let created = 0;

      for (const tx of parsedTxs) {
        let finalCategory = tx.category || "UNCATEGORIZED";
        let normalizedMerchant = normalizeMerchant(tx.merchant);

        if (normalizedMerchant) {
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
          } else if (tx.category && tx.category !== "UNCATEGORIZED") {
            await prisma.merchantCategory.create({
              data: {
                userId: rawEmail.userId,
                merchantKeyword: normalizedMerchant,
                category: tx.category
              }
            });
          }
        }

        await prisma.transaction.create({
          data: {
            userId: rawEmail.userId,
            amount: tx.amount,
            type: tx.type,
            category: finalCategory,
            merchant: normalizedMerchant,
            date: rawEmail.receivedAt,
            source: tx.source || "REGEX"
          }
        });

        created++;
      }

      console.log(`${created} transactions created for RawEmail ${rawEmailId}`);
    } catch (err) {
      console.error("Worker error:", err);
    }
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