import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requireAuth } from "./middlewares/auth.middleware.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get("/", (req, res) => {
  res.send("Fintech backend running...");
});

app.get("/db-test", async (req, res, next) => {
  try {
    const count = await prisma.user.count();
    res.json({ ok: true, users: count });
  } catch (err) {
    next(err);
  }
});

app.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});


app.use("/api/v1/auth", authRoutes);

app.use(errorMiddleware);

export default app;
