const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// 🔹 Роутеры
const developersRouter = require('./serveroutes/developers');
const categoriesRouter = require('./serveroutes/categories');
const casesRouter = require('./serveroutes/cases');
const discussionsRouter = require('./serveroutes/discussions');
const contactsRouter = require('./serveroutes/contacts');

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
