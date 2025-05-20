import { Router } from 'express';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer, { diskStorage } from 'multer';

const router = Router();

// 🔹 Эмуляция __dirname для ES-модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '../data/categories.json');
const UPLOAD_DIR = join(__dirname, '../uploads');

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = diskStorage({
  destination: (_, __, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

const readData = () => {
  try {
    if (!existsSync(DATA_FILE)) {
      writeFileSync(DATA_FILE, '[]');
    }
    const content = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
};

const writeData = (data) => {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
    const imagePath = join(UPLOAD_DIR, cat.image);
    if (existsSync(imagePath)) {
      unlinkSync(imagePath);
    }
  }

  categories = categories.filter((c) => c.id !== id);
  writeData(categories);
  res.json({ success: true });
});

export default router;
