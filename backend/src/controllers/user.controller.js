import prisma from "../config/prisma.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};