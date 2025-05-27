import { Router } from 'express';
import multer from 'multer';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOAD_DIR = join(__dirname, '../uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

function parseContentBlocks(req) {
  const blocks = [];
  const raw = req.body.contentBlocksText;
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      try {
        blocks.push(JSON.parse(item));
      } catch {}
    });
  } else if (typeof raw === 'string') {
    try {
      blocks.push(JSON.parse(raw));
    } catch {}
  }

  const files = req.files?.contentBlocksImage || [];
  files.forEach((file) => {
    blocks.push({ type: 'image', filename: file.filename });
  });

  return blocks;
}

router.get('/', async (req, res) => {
  const data = await prisma.case.findMany();
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const found = await prisma.case.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: 'Кейс не найден' });
  res.json(found);
});

router.post(
  '/',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'contentBlocksImage', maxCount: 50 },
  ]),
  async (req, res, next) => {
    try {
      console.log('[BODY]', req.body);
      const data = {
        title: req.body.title,
        taskDesc: req.body.taskDesc || '',
        clientDesc: req.body.clientDesc || '',
        servicesDesc: req.body.servicesDesc || '',
        contentBlocks: parseContentBlocks(req),
        price: parseInt(req.body.price || '0'),
        link: req.body.link,
        date: req.body.date,
        positionTop: req.body.positionTop,
        preview: req.files?.preview?.[0]?.filename || null,
        images: req.files?.images?.map((f) => f.filename) || [],
        developerIds: JSON.parse(req.body.developerIds || '[]'),
        categoryIds: JSON.parse(req.body.categoryIds || '[]'),
      };

      const created = await prisma.case.create({ data });
      res.status(201).json(created);
    } catch (error) {
      console.error('[POST /cases] Ошибка:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
);


router.put(
  '/:id',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'contentBlocksImage', maxCount: 50 },
  ]),

  async (req, res) => {
    const id = parseInt(req.params.id);
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Кейс не найден' });

    const updated = await prisma.case.update({
      where: { id },
      data: {
        title: req.body.title,
        price: parseInt(req.body.price || '0'),
        link: req.body.link,
        date: req.body.date,
        positionTop: req.body.positionTop,
        developerIds: JSON.parse(req.body.developerIds || '[]'),
        categoryIds: JSON.parse(req.body.categoryIds || '[]'),
        preview: req.files?.preview?.[0]?.filename || existing.preview,
        images: req.files?.images?.length
          ? req.files.images.map((f) => f.filename)
          : existing.images,
        taskDesc: req.body.taskDesc || '',
        clientDesc: req.body.clientDesc || '',
        servicesDesc: req.body.servicesDesc || '',
        contentBlocks: parseContentBlocks(req),
      },
    });

    res.json(updated);
  }
);

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
