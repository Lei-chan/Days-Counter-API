import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import routes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : process.env.CLIENT_URL_DEV,
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

// const limiter = rateLimit({
//   windowMs: 8 * 60 * 1000,
//   max: 100,
//   message: {
//     success: false,
//     message: "Too many requiests from this IP! <br>Try again later",
//   },
// });

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use("/api", routes);

app.use(errorHandler);

export default app;
