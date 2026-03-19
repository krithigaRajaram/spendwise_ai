import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import { deleteUserCompletely } from "../modules/gmail/gmail.cleanup.js";

// GET /profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const gmailToken = await prisma.gmailToken.findUnique({
      where: { userId },
      select: { gmailEmail: true }
    });

    const syncState = await prisma.gmailSyncState.findUnique({
      where: { userId },
      select: { disconnectedAt: true }
    });

    res.json({
      ...user,
      gmail: {
        connected: !!gmailToken && !syncState?.disconnectedAt,
        gmailEmail: gmailToken?.gmailEmail || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// PUT /profile/name
export const updateName = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update name" });
  }
};

// PUT /profile/password
export const updatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update password" });
  }
};

// DELETE /profile
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await deleteUserCompletely(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};