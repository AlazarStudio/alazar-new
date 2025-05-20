import { readFileSync } from 'fs';
import { createServer } from 'https';
import express, { json } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import developersRouter from './routes/developers';
import categoriesRouter from './routes/categories';
import casesRouter from './routes/cases';
import cors from 'cors';

// 🔹 Эмуляция __dirname в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

// Заменить на свои пути
const sslOptions = {
  key: readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/privkey.pem'),
  cert: readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/fullchain.pem')
};

// Загружаем middleware и маршруты
app.use(json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/api/developers', developersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cases', casesRouter);

// Запуск HTTPS-сервера
createServer(sslOptions, app).listen(443, () => {
  console.log('✅ HTTPS-сервер запущен: https://backend.alazarstudio.ru');
});
