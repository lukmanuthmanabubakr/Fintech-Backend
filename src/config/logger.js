import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../../logs");


if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === "production";

const pinoOptions = {
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  timestamp: pino.stdTimeFunctions.isoTime,
};

const transports = isProduction
  ? pino.transport({
      targets: [
        {
          level: "info",
          target: "pino/file",
          options: { destination: path.join(logsDir, "combined.log") },
        },
        {
          level: "error",
          target: "pino/file",
          options: { destination: path.join(logsDir, "error.log") },
        },
      ],
    })
  : pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    });

export const logger = pino(pinoOptions, transports);
