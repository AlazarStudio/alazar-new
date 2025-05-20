import { Router } from 'express';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer, { diskStorage } from 'multer';

const router = Router();

// 🔹 Эмуляция __dirname для ES-модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = join(__dirname, '../uploads');

// Хранилище для изображений
const storage = diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });

const readData = () => {
  try {
    if (!existsSync(DATA_FILE)) writeFileSync(DATA_FILE, '[]');
    const content = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
};

const writeData = (data) => {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
    { name: 'preview', maxCount: 1 },
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
      const filePath = join(UPLOAD_DIR, filename);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    });
  }

  cases = cases.filter((c) => c.id !== id);
  writeData(cases);
  res.json({ success: true });
});

export default router;
