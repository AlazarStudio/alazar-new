import { Router } from 'express';
const router = Router();
import multer, { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UPLOAD_DIR = join(__dirname, '../uploads');

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + extname(file.originalname)),
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
    const imgPath = join(UPLOAD_DIR, cat.image);
    if (existsSync(imgPath)) unlinkSync(imgPath);
  }

  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
