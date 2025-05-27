import { Router } from 'express';
import { join, extname, dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import multer, { diskStorage } from 'multer';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const router = Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = join(__dirname, '../uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

// 🔧 Хелпер: парсинг контент-блоков
function parseContentBlocks(req) {
  const result = [];
  const raw = req.body.contentBlocks;

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      try {
        const parsed = JSON.parse(item);
        if (parsed.type === 'text') result.push(parsed);
      } catch {}
    });
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type === 'text') result.push(parsed);
    } catch {}
  }

  const files = req.files?.contentBlocks || [];
  files.forEach((file) => {
    result.push({ type: 'image', filename: file.filename });
  });

  return result;
}

// 🔹 Получить все кейсы
router.get('/', async (req, res) => {
  const data = await prisma.case.findMany();
  res.json(data);
});

// 🔹 Получить кейс по ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const found = await prisma.case.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: 'Кейс не найден' });
  res.json(found);
});

// 🔹 Добавить новый кейс
router.post(
  '/',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'contentBlocks', maxCount: 50 },
  ]),
  async (req, res) => {
    const data = {
      title: req.body.title,
      price: parseInt(req.body.price),
      link: req.body.link,
      date: req.body.date,
      positionTop: req.body.positionTop,
      preview: req.files?.preview?.[0]?.filename || null,
      images: req.files?.images?.map((f) => f.filename) || [],
      developerIds: JSON.parse(req.body.developerIds || '[]'),
      categoryIds: JSON.parse(req.body.categoryIds || '[]'),
      taskDesc: req.body.taskDesc || '',
      clientDesc: req.body.clientDesc || '',
      servicesDesc: req.body.servicesDesc || '',
      contentBlocks: parseContentBlocks(req),
    };

    const created = await prisma.case.create({ data });
    res.status(201).json(created);
  },
);

// 🔹 Обновить кейс
router.put(
  '/:id',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'contentBlocks', maxCount: 50 },
  ]),
  async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Кейс не найден' });

    const updated = await prisma.case.update({
      where: { id },
      data: {
        title: req.body.title,
        price: parseInt(req.body.price),
        link: req.body.link,
        date: req.body.date,
        positionTop: req.body.positionTop,
        developerIds: JSON.parse(req.body.developerIds || '[]'),
        categoryIds: JSON.parse(req.body.categoryIds || '[]'),
        preview: req.files?.preview?.[0]?.filename || existing.preview,
        images: req.files?.images?.length ? req.files.images.map((f) => f.filename) : existing.images,
        taskDesc: req.body.taskDesc || '',
        clientDesc: req.body.clientDesc || '',
        servicesDesc: req.body.servicesDesc || '',
        contentBlocks: parseContentBlocks(req),
      },
    });

    res.json(updated);
  },
);

// 🔹 Удалить кейс
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.case.findUnique({ where: { id } });

  if (!existing) return res.status(404).json({ error: 'Не найдено' });

  if (existing.images?.length) {
    existing.images.forEach((file) => {
      const filePath = join(UPLOAD_DIR, file);
      if (existsSync(filePath)) unlinkSync(filePath);
    });
  }

  if (existing.preview) {
    const previewPath = join(UPLOAD_DIR, existing.preview);
    if (existsSync(previewPath)) unlinkSync(previewPath);
  }

  await prisma.case.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
