import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;

const UNVERIFIED_ALLOWED_ROUTES = ["/auth/verify", "/auth/resend-verification"];

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    // Skip isVerified check for verification routes
    const isAllowedUnverified = UNVERIFIED_ALLOWED_ROUTES.some(route =>
      req.path.includes(route) || req.originalUrl.includes(route)
    );

    if (!isAllowedUnverified) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user?.isVerified) {
        return res.status(403).json({ error: "Email not verified" });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;