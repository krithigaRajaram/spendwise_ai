import { google } from "googleapis";
import prisma from "../../config/prisma.js";

export const getGmailClient = async (userId) => {
  const token = await prisma.gmailToken.findUnique({
    where: { userId }
  });

  if (!token) {
    throw new Error("Gmail not connected for this user");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: Number(token.expiryDate)
  });

  // Auto-refresh token if needed
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.gmailToken.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token,
          expiryDate: BigInt(tokens.expiry_date)
        }
      });
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
};