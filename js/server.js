import "dotenv/config";
import connectDB from "./database.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

let server;

const startServer = async function () {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on ${process.env.SERVER_URL}`);

    ////For dev
    // console.log(`Server is running on http://localhost:${PORT}`);
  });
};
startServer();

//Handle unhandled async errors
process.on("unhandledRejection", (err, promise) => {
  console.log(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

//Handle unhandled sync errors
process.on("uncaughtException", (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
