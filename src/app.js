import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./config/db.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger.js";
import walletsRoutes from "./modules/wallets/wallets.routes.js";



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



app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallets", walletsRoutes);



app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorMiddleware);

export default app;
