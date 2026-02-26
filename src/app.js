import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger.js";
import walletsRoutes from "./modules/wallets/wallets.routes.js";
import transactionsRoutes from "./modules/transactions/transactions.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import webhooksRoutes from "./modules/webhooks/webhooks.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";







const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
const allowedOrigins = (process.env.CORS_ORIGIN).split(",");

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false }));

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



app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallets", walletsRoutes);
app.use("/api/v1/transactions", transactionsRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/webhooks", webhooksRoutes);
app.use("/api/v1/admin", adminRoutes);




app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorMiddleware);

export default app;
