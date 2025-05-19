const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Получить все категории
router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// Добавить категорию
router.post('/', upload.single('image'), async (req, res) => {
  const { name, description } = req.body;
  const image = req.file?.filename || null;

  const created = await prisma.category.create({
    data: { name, description, image },
  });
  res.status(201).json(created);
});

// Обновить категорию
router.put('/:id', upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return res.status(404).json({ error: 'Не найдено' });

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: req.body.name,
      description: req.body.description,
      image: req.file?.filename || category.image,
    },
  });
  res.json(updated);
});

// Удалить категорию
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return res.status(404).json({ error: 'Не найдено' });

  if (cat.image) {
    const imgPath = path.join(UPLOAD_DIR, cat.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
});

module.exports = router;
