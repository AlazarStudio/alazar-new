const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');

const app = express();

// Заменить на свои пути
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/backend.alazarstudio.ru/fullchain.pem')
};

// Загружаем middleware и маршруты
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'server/uploads')));
app.use('/api/developers', await import('./routes/developers.js').then(m => m.default));
app.use('/api/categories', await import('./routes/categories.js').then(m => m.default));
app.use('/api/cases', await import('./routes/cases.js').then(m => m.default));

// Запуск HTTPS-сервера
https.createServer(sslOptions, app).listen(443, () => {
  console.log('✅ HTTPS-сервер запущен: https://backend.alazarstudio.ru');
});
