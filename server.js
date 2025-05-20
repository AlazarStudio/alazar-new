import { readFileSync } from 'fs';
import { createServer } from 'http';
import { createServer as _createServer } from 'https';
import express, { json } from 'express';
import { join } from 'path';
import cors from 'cors';
require('dotenv').config();

// 🔹 Роутеры
import authRoutes from './serverRoutes/auth/auth.routes';
import userRoutes from './serverRoutes/user/user.routes';
import developersRouter from './serverRoutes/developers';
import categoriesRouter from './serverRoutes/categories';
import casesRouter from './serverRoutes/cases';
import discussionsRouter from './serverRoutes/discussion';
import contactsRouter from './serverRoutes/contacts';

const app = express();
app.use(cors());
app.use(json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

// 🔹 API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/developers', developersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/discussions', discussionsRouter);
app.use('/api/contacts', contactsRouter);

// 🔹 Конфигурация
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'production') {
  const sslOptions = {
    key: readFileSync(
      '/etc/letsencrypt/live/backend.alazarstudio.ru/privkey.pem'
    ),
    cert: readFileSync(
      '/etc/letsencrypt/live/backend.alazarstudio.ru/fullchain.pem'
    ),
  };

  _createServer(sslOptions, app).listen(443, () => {
    console.log('✅ HTTPS-сервер запущен: https://backend.alazarstudio.ru');
  });
} else {
  // 🔹 Локальный HTTP-сервер
  createServer(app).listen(PORT, () => {
    console.log(`🚀 HTTP-сервер запущен локально: http://localhost:${PORT}`);
  });
}
