import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";

// Create an Express application (your web server)
const app = express();

app.use(
  cors({
    // origin: process.env.CLIENT_URL || "http://localhost:1234",
    origin: true,
    credentials: true,
    // allowedHeaders: ["Content-Type", ""],
  })
);

app.use(
  express.json({
    limit: "1mb",
    strict: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false, //For development
  })
);

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requiests from this IP, Try again later",
  },
});

app.use(cookieParser());

app.use("/api/user", limiter, routes);

app.use(errorHandler);

export default app;
