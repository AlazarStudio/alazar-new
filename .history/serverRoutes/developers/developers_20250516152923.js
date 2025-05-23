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

// Получить всех разработчиков
router.get('/', async (req, res) => {
  const devs = await prisma.developer.findMany();
  res.json(devs);
});

// Добавить разработчика
router.post('/', upload.single('image'), async (req, res) => {
  const { name, position, email } = req.body;
  const avatar = req.file?.filename || null;

  const dev = await prisma.developer.create({
    data: { name, position, email, avatar },
  });
  res.status(201).json(dev);
});

// Обновить
router.put('/:id', upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id);
  const dev = await prisma.developer.findUnique({ where: { id } });
  if (!dev) return res.status(404).json({ error: 'Не найдено' });

  const updated = await prisma.developer.update({
    where: { id },
    data: {
      name: req.body.name,
      position: req.body.position,
      email: req.body.email,
      avatar: req.file?.filename || dev.avatar,
    },
  });
  res.json(updated);
});

// Удалить
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const dev = await prisma.developer.findUnique({ where: { id } });

  if (!dev) return res.status(404).json({ error: 'Не найдено' });

  if (dev.avatar) {
    const filePath = path.join(UPLOAD_DIR, dev.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.developer.delete({ where: { id } });
  res.json({ success: true });
});

module.exports = router;
