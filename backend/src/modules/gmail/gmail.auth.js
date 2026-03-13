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
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email"
    ],
    prompt: "consent",
    state: String(req.userId)
  });

  res.redirect(url);
};

export const gmailCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) return res.status(400).send("Missing authorization code");

    const userId = Number(state);
    if (!userId) return res.status(400).send("Missing user identity");

    const { tokens } = await oauth2Client.getToken(code);

    // Create a new client with tokens explicitly set
    const authedClient = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    authedClient.setCredentials(tokens);

    // Get the Gmail address using the authed client
    const oauth2 = google.oauth2({ version: "v2", auth: authedClient });
    const { data: googleUser } = await oauth2.userinfo.get();
    const gmailEmail = googleUser.email;

    // Check if this Gmail is already connected to a different user
    const existingToken = await prisma.gmailToken.findFirst({
      where: { gmailEmail }
    });

    if (existingToken && existingToken.userId !== userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?gmail=already_connected`);
    }

    await prisma.gmailToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: BigInt(tokens.expiry_date),
        gmailEmail
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: BigInt(tokens.expiry_date),
        gmailEmail
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?gmail=connected`);

  } catch (error) {
    console.error("Gmail OAuth error:", error);
    res.status(500).send("Failed to connect Gmail");
  }
};