const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const DATA_FILE = path.join(__dirname, '../data/categories.json');
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Получить все
router.get('/', (req, res) => {
  const data = readData();
  res.json(data);
});

// Добавить
router.post('/', upload.single('image'), (req, res) => {
  const categories = readData();

  const newCategory = {
    id: Date.now(),
    name: req.body.name,
    description: req.body.description,
    image: req.file ? req.file.filename : null,
  };

  categories.push(newCategory);
  writeData(categories);
  res.status(201).json(newCategory);
});

// Обновить
router.put('/:id', upload.single('image'), (req, res) => {
  const id = parseInt(req.params.id);
  const categories = readData();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return res.status(404).json({ error: 'Не найдено' });

  categories[index] = {
    ...categories[index],
    name: req.body.name,
    description: req.body.description,
    image: req.file ? req.file.filename : categories[index].image,
  };

  writeData(categories);
  res.json(categories[index]);
});

// Удалить
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let categories = readData();
  const cat = categories.find((c) => c.id === id);

  if (cat?.image) {
    const imagePath = path.join(UPLOAD_DIR, cat.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  categories = categories.filter((c) => c.id !== id);
  writeData(categories);
  res.json({ success: true });
});

module.exports = router;
