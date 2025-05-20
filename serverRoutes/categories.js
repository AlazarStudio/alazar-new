import { Router } from 'express';
import multer, { diskStorage } from 'multer';
import { join, extname, dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const router = Router();
const prisma = new PrismaClient();

// ────────────────────────────────
// Эмуляция __dirname в ESM‑среде
// ────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ────────────────────────────────
// Конфигурация загрузки файлов
// ────────────────────────────────
const UPLOAD_DIR = join(__dirname, '../uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename:   (_, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`)
});
const upload = multer({ storage });

// ────────────────────────────────
// Маршруты API
// ────────────────────────────────

// ▸ Получить все категории
router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// ▸ Добавить категорию
router.post('/', upload.single('image'), async (req, res) => {
  const { name, description } = req.body;
  const image = req.file?.filename || null;

  const created = await prisma.category.create({
    data: { name, description, image }
  });
  res.status(201).json(created);
});

// ▸ Обновить категорию
router.put('/:id', upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return res.status(404).json({ error: 'Не найдено' });

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name:        req.body.name,
      description: req.body.description,
      image:       req.file?.filename || category.image
    }
  });
  res.json(updated);
});

// ▸ Удалить категорию
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return res.status(404).json({ error: 'Не найдено' });

  if (cat.image) {
    const imgPath = join(UPLOAD_DIR, cat.image);
    if (existsSync(imgPath)) unlinkSync(imgPath);
  }

  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
