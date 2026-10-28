require("dotenv").config();

const express = require("express");
const http = require("node:http");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { Server } = require("socket.io");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ message: "Too many requests. Please try again later." });
  },
});

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin is not allowed");
      error.statusCode = 403;
      return callback(error);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/api", apiLimiter);
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.error("MongoDB connection failed", {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
    });
  });

app.get("/", (req, res) => {
  res.send("Full Stack API is Running");
});

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.statusCode = 404;
  next(error);
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Chat client connected");

  socket.on("chatMessage", (payload, acknowledge) => {
    const rejectMessage = (message) => {
      if (typeof acknowledge === "function") {
        acknowledge({ ok: false, error: message });
      }
    };

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      rejectMessage("A username and message are required.");
      return;
    }

    const username = typeof payload.username === "string" ? payload.username.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!username || username.length > 24 || /[\u0000-\u001f\u007f]/.test(username)) {
      rejectMessage("Username must be between 1 and 24 characters.");
      return;
    }

    if (!message || message.length > 500) {
      rejectMessage("Message must be between 1 and 500 characters.");
      return;
    }

    io.emit("chatMessage", {
      username,
      message,
      sentAt: new Date().toISOString(),
    });

    if (typeof acknowledge === "function") {
      acknowledge({ ok: true });
    }
  });

  socket.on("disconnect", () => {
    console.log("Chat client disconnected");
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
