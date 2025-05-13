const express = require('express');

const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const DATA_FILE = path.join(__dirname, '../data/cases.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Хранилище для изображений
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// 🔹 Получить все кейсы
router.get('/', (req, res) => {
  const data = readData();
  res.json(data);
});

// Получить один кейс по ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cases = readData();
  const one = cases.find((c) => c.id === id);
  if (!one) {
    return res.status(404).json({ error: 'Кейс не найден' });
  }
  res.json(one);
});

// 🔹 Добавить новый кейс
router.post(
  '/',
  upload.fields([
    { name: 'gifPreview', maxCount: 1 },
    { name: 'gifPreview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
  ]),
  (req, res) => {
    const cases = readData();

    const newCase = {
      id: Date.now(),
      title: req.body.title,
      price: Number(req.body.price),
      link: req.body.link,
      date: req.body.date,
      positionTop: req.body.positionTop,
      developerIds: JSON.parse(req.body.developerIds || '[]'),
      categoryIds: JSON.parse(req.body.categoryIds || '[]'),
      gifPreview: req.files?.gifPreview?.[0]?.filename || null,
      preview: req.files?.preview?.[0]?.filename || null,
      images: req.files?.images?.map((f) => f.filename) || [],
    };

    cases.push(newCase);
    writeData(cases);
    res.status(201).json(newCase);
  }
);

// 🔹 Обновить кейс
router.put(
  '/:id',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
  ]),
  (req, res) => {
    const id = parseInt(req.params.id);
    const cases = readData();
    const index = cases.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Кейс не найден' });

    const updated = {
      ...cases[index],
      title: req.body.title,
      price: Number(req.body.price),
      link: req.body.link,
      date: req.body.date,
      positionTop: req.body.positionTop,
      developerIds: JSON.parse(req.body.developerIds || '[]'),
      categoryIds: JSON.parse(req.body.categoryIds || '[]'),
      gifPreview: req.files?.gifPreview?.[0]?.filename || cases[index].gifPreview,
      preview: req.files?.preview?.[0]?.filename || cases[index].preview,
      images:
        req.files?.images?.length > 0
          ? req.files.images.map((f) => f.filename)
          : cases[index].images,
    };

    cases[index] = updated;
    writeData(cases);
    res.json(updated);
  }
);

// 🔹 Удалить кейс
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let cases = readData();
  const item = cases.find((c) => c.id === id);

  if (item?.images?.length) {
    item.images.forEach((filename) => {
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  cases = cases.filter((c) => c.id !== id);
  writeData(cases);
  res.json({ success: true });
});

module.exports = router;
