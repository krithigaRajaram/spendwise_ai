import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendVerificationEmail } from "../modules/gmail/gmail.mailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const googleClient = new OAuth2Client(process.env.GMAIL_CLIENT_ID);

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationExpiry,
        authProvider: "EMAIL"
      }
    });

    await sendVerificationEmail(email, name, verificationCode);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "5h" });
    res.status(201).json({ token, isVerified: false });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Signup failed" });
  }
};

export const googleAuth = async (req, res) => {
  const { googleId, email, name } = req.body;

  if (!googleId || !email || !name) {
    return res.status(400).json({ error: "Google credentials are required" });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId, isVerified: true }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          isVerified: true,
          authProvider: "GOOGLE"
        }
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "5h" });
    res.json({ token, isVerified: true });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
};


export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  const userId = req.userId;

  if (!code) {
    return res.status(400).json({ error: "Verification code is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Email already verified" });
    if (!user.verificationCode || !user.verificationExpiry) {
      return res.status(400).json({ error: "No verification code found" });
    }
    if (new Date() > new Date(user.verificationExpiry)) {
      return res.status(400).json({ error: "Verification code expired" });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, verificationCode: null, verificationExpiry: null }
    });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
};

export const resendVerification = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Email already verified" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { verificationCode, verificationExpiry }
    });

    await sendVerificationEmail(user.email, user.name, verificationCode);
    res.json({ message: "Verification code resent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resend verification code" });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Google SSO users don't have a password
    if (user.authProvider === "GOOGLE" && !user.password) {
      return res.status(401).json({ error: "Please sign in with Google" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isVerified) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "5h" });
      return res.status(403).json({ error: "Email not verified", token, isVerified: false });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "5h" });
    res.json({ token, isVerified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};