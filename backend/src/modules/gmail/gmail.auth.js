import { google } from "googleapis";
import prisma from "../../config/prisma.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

export const startGmailAuth = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    prompt: "consent"
  });

  res.redirect(url);
};

export const gmailCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userId = req.user?.id || 1;
    await prisma.gmailToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: BigInt(tokens.expiry_date)
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: BigInt(tokens.expiry_date)
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?gmail=connected`);

  } catch (error) {
    console.error("Gmail OAuth error:", error);
    res.status(500).send("Failed to connect Gmail");
  }
};