const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

// Получить все кейсы
router.get('/', async (req, res) => {
  const data = await prisma.case.findMany();
  res.json(data);
});

// Получить кейс по ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const found = await prisma.case.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: 'Кейс не найден' });
  res.json(found);
});

// Добавить новый кейс
router.post(
  '/',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
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
    };

    const created = await prisma.case.create({ data });
    res.status(201).json(created);
  }
);

// Обновить кейс
router.put(
  '/:id',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
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
        images:
          req.files?.images?.length > 0
            ? req.files.images.map((f) => f.filename)
            : existing.images,
      },
    });

    res.json(updated);
  }
);

// Удалить кейс
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.case.findUnique({ where: { id } });

  if (!existing) return res.status(404).json({ error: 'Не найдено' });

  if (existing.images?.length) {
    existing.images.forEach((file) => {
      const filePath = path.join(UPLOAD_DIR, file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  }

  if (existing.preview) {
    const previewPath = path.join(UPLOAD_DIR, existing.preview);
    if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath);
  }

  await prisma.case.delete({ where: { id } });
  res.json({ success: true });
});

module.exports = router;
