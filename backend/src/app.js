import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import reportRoutes from "./routes/report.routes.js";
import queueRoutes from "./routes/queue.routes.js";
import gmailRoutes from "./modules/gmail/gmail.routes.js";

const app = express();
app.use(express.json());``
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/transactions", transactionRoutes);
app.use("/reports", reportRoutes);
app.use("/queue", queueRoutes);
app.use("/gmail", gmailRoutes);
app.use("/profile", profileRoutes);

export default app;