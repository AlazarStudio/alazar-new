const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Роуты
app.use('/api/developers', require('./routes/developers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cases', require('./routes/cases'));

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
