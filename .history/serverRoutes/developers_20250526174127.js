import { Router } from 'express';
import multer, { diskStorage } from 'multer';
import { join, extname, dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Эмуляция __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOAD_DIR = join(__dirname, '../uploads');

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + extname(file.originalname)),
});
const upload = multer({ storage });

// Получить всех разработчиков
router.get('/', async (req, res) => {
  const devs = await prisma.developer.findMany();
  res.json(devs);
});

// Добавить разработчика
router.post('/', upload.single('image'), async (req, res) => {
  const {
    name,
    position,
    email,
    telegram,
    instagram,
    whatsapp,
    vk,
    tiktok,
    behance,
    pinterest,
    artstation,
  } = req.body;
  const avatar = req.file?.filename || null;

  const dev = await prisma.developer.create({
    data: {
      name,
      position,
      avatar,
      email,
      telegram,
      instagram,
      whatsapp,
      vk,
      tiktok,
      behance,
      pinterest,
      artstation,
    },
  });
  res.status(201).json(dev);
});

// Обновить разработчика
router.put('/:id', upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dev = await prisma.developer.findUnique({ where: { id } });
  if (!dev) return res.status(404).json({ error: 'Не найдено' });

  const updated = await prisma.developer.update({
    where: { id },
    data: {
      name: req.body.name,
      position: req.body.position,
      email: req.body.email,
      avatar: req.file?.filename || dev.avatar,
      telegram: req.body.telegram,
      instagram: req.body.instagram,
      whatsapp: req.body.whatsapp,
      vk: req.body.vk,
      tiktok,
      behance,
      pinterest,
      artstation,
    },
  });
  res.json(updated);
});

// Удалить разработчика
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dev = await prisma.developer.findUnique({ where: { id } });

  if (!dev) return res.status(404).json({ error: 'Не найдено' });

  if (dev.avatar) {
    const filePath = join(UPLOAD_DIR, dev.avatar);
    if (existsSync(filePath)) unlinkSync(filePath);
  }

  await prisma.developer.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
