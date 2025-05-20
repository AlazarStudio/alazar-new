import { readFileSync } from "fs";
import { createServer } from "http";
import { createServer as _createServer } from "https";
import express, { json } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Эмуляция __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔹 Импорт роутов
import authRoutes from "./serverRoutes/auth/auth.routes.js";
import userRoutes from "./serverRoutes/user/user.routes.js";
import developersRouter from "./serverRoutes/developers/index.js";
import categoriesRouter from "./serverRoutes/categories/index.js";
import casesRouter from "./serverRoutes/cases/index.js";
import discussionsRouter from "./serverRoutes/discussion/index.js";
import contactsRouter from "./serverRoutes/contacts/index.js";

// 🔹 Создание приложения
const app = express();

app.use(cors());
app.use(json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// 🔹 Роуты API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/developers", developersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/cases", casesRouter);
app.use("/api/discussions", discussionsRouter);
app.use("/api/contacts", contactsRouter);

// 🔹 Порт и среда
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || "development";

if (ENV === "production") {
  const sslOptions = {
    key: readFileSync(
      "/etc/letsencrypt/live/backend.alazarstudio.ru/privkey.pem"
    ),
    cert: readFileSync(
      "/etc/letsencrypt/live/backend.alazarstudio.ru/fullchain.pem"
    ),
  };

  _createServer(sslOptions, app).listen(443, () => {
    console.log("✅ HTTPS-сервер запущен: https://backend.alazarstudio.ru");
  });
} else {
  createServer(app).listen(PORT, () => {
    console.log(`🚀 HTTP-сервер запущен локально: http://localhost:${PORT}`);
  });
}
