const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// 🔹 Роутеры
const developersRouter = require('./serverRoutes/developers/developers');
const categoriesRouter = require('./serverRoutes/categories/categories');
const casesRouter = require('./serverRoutes/cases/cases');
const discussionsRouter = require('./serverRoutes/discussion/discussion');
const contactsRouter = require('./serverRoutes/contacts/contacts');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 API
app.use('/api/developers', developersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/discussions', discussionsRouter);
app.use('/api/contacts', contactsRouter);
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Конфигурация
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

if (ENV === 'production') {
  const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/fullchain.pem'),
  };

  https.createServer(sslOptions, app).listen(443, () => {
    console.log(`✅ HTTPS-сервер запущен: https://backend.alazarstudio.ru`);
  });
} else {
  // 🔹 Локальный HTTP-сервер
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 HTTP-сервер запущен локально: http://localhost:${PORT}`);
  });
}
