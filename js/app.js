import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import routes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";

//I got rid off process.env for production
const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
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
    contentSecurityPolicy: true,
  })
);

const limiter = rateLimit({
  windowMs: 8 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requiests from this IP! <br>Try again later",
  },
});

app.use(cookieParser());

app.use("/api", limiter, routes);

app.use(errorHandler);

export default app;
