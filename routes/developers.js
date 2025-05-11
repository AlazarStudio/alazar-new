const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Пути
const DATA_FILE = path.join(__dirname, '../data/developers.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Создать папку uploads при необходимости
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Настройка multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// Чтение файла с безопасностью
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]');
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
};

// Запись данных
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Получить всех
router.get('/', (req, res) => {
  const data = readData();
  res.json(data);
});

// Добавить нового
router.post('/', upload.single('image'), (req, res) => {
  const developers = readData();

  const newDev = {
    id: Date.now(),
    name: req.body.name,
    position: req.body.position,
    email: req.body.email,
    avatar: req.file ? req.file.filename : null,
  };

  developers.push(newDev);
  writeData(developers);
  res.status(201).json(newDev);
});

// Обновить
router.put('/:id', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id);
  const developers = readData();
  const index = developers.findIndex((d) => d.id === id);

  if (index === -1) return res.status(404).json({ error: 'Не найдено' });

  developers[index] = {
    ...developers[index],
    name: req.body.name,
    position: req.body.position,
    email: req.body.email,
    avatar: req.file ? req.file.filename : developers[index].avatar,
  };

  writeData(developers);
  res.json(developers[index]);
});

// Удалить
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let developers = readData();
  const dev = developers.find((d) => d.id === id);

  // Удаление файла (необязательно, но можно)
  if (dev?.avatar) {
    const avatarPath = path.join(UPLOAD_DIR, dev.avatar);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
  }

  developers = developers.filter((d) => d.id !== id);
  writeData(developers);
  res.json({ success: true });
});

module.exports = router;
