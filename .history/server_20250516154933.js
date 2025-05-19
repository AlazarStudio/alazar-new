const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// 🔹 Роутеры
const developersRouter = require('./outes/developers');
const categoriesRouter = require('./outes/categories');
const casesRouter = require('./outes/cases');
const discussionsRouter = require('./outes/discussions');
const contactsRouter = require('./outes/contacts');

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Статика
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Роуты
app.use('/api/developers', developersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/discussions', discussionsRouter);
app.use('/api/contacts', contactsRouter);

// 🔹 HTTPS-сертификаты
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/fullchain.pem'),
};

// 🔹 Запуск сервера
const PORT = process.env.PORT || 443;

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`✅ HTTPS-сервер запущен: https://backend.alazarstudio.ru (порт ${PORT})`);
});
