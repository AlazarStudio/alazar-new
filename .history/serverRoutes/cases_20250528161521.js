import { Router } from 'express';
import { join, extname, dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const router = Router();
const prisma = new PrismaClient();

// 🔧 Эмуляция __dirname для ES-модуля
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Директория для загрузок
const UPLOAD_DIR = join(__dirname, '../uploads');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

// Настройка хранилища и фильтрации файлов
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // принимаем только изображения
    if (!file.mimetype.startsWith('image/')) {
      return cb(
        new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname)
      );
    }
    cb(null, true);
  },
});

// Вспомогательная функция удаления файла
function safeUnlink(fileName) {
  const p = join(UPLOAD_DIR, fileName);
  if (existsSync(p)) unlinkSync(p);
}

// 🔹 Получить все кейсы
router.get('/', async (req, res) => {
  const data = await prisma.case.findMany();
  res.json(data);
});

// 🔹 Получить кейс по ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
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
    { name: 'blockImages', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        price,
        link,
        date,
        positionTop,
        taskDescription,
        clientDescription,
        serviceDescription,
        developerIds,
        categoryIds,
        blocks,
        shop,
      } = req.body;

      // Валидация обязательных полей
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Не указан title' });
      }
      if (!price || isNaN(parseInt(price, 10))) {
        return res.status(400).json({ error: 'Неверный price' });
      }

      // Парсинг JSON-полей с защитой от ошибок
      let parsedBlocksRaw = [];
      try {
        parsedBlocksRaw = JSON.parse(blocks || '[]');
      } catch {
        return res.status(400).json({ error: 'Неверный формат blocks' });
      }
      let devIds = [];
      try {
        devIds = JSON.parse(developerIds || '[]');
      } catch {
        return res.status(400).json({ error: 'Неверный формат developerIds' });
      }
      let catIds = [];
      try {
        catIds = JSON.parse(categoryIds || '[]');
      } catch {
        return res.status(400).json({ error: 'Неверный формат categoryIds' });
      }

      // Сборка контент-блоков
      let imgIndex = 0;
      const parsedBlocks = parsedBlocksRaw.map((b) => {
        if (b.type === 'text') return b;
        const file = req.files?.blockImages?.[imgIndex++];
        return {
          type: 'image',
          value: file?.filename || '',
        };
      });

      // Создание записи в БД
      const created = await prisma.case.create({
        data: {
          title: title.trim(),
          price: price ? parseInt(price, 10) : null,
          link: link || null,
          date: date ? new Date(date) : null,
          positionTop: positionTop || null,
          taskDescription: taskDescription || '',
          clientDescription: clientDescription || '',
          serviceDescription: serviceDescription || '',
          shop: shop === 'true',
          developerIds: devIds,
          categoryIds: catIds,
          preview: req.files?.preview?.[0]?.filename || null,
          images: req.files?.images?.map((f) => f.filename) || [],
          contentBlocks: parsedBlocks,
        },
      });

      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка при создании кейса' });
    }
  }
);

// 🔹 Обновить кейс
router.put(
  '/:id',
  upload.fields([
    { name: 'preview', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'blockImages', maxCount: 50 },
  ]),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.case.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Кейс не найден' });

      const {
        title,
        price,
        link,
        date,
        positionTop,
        taskDescription,
        clientDescription,
        serviceDescription,
        developerIds,
        categoryIds,
        blocks,
        shop,
      } = req.body;

      // Валидация и парсинг JSON
      if (title && (typeof title !== 'string' || !title.trim())) {
        return res.status(400).json({ error: 'Неверный title' });
      }
      let parsedBlocks = existing.contentBlocks || [];
      if (blocks) {
        let rawBlocks;
        try {
          rawBlocks = JSON.parse(blocks);
        } catch {
          return res.status(400).json({ error: 'Неверный формат blocks' });
        }
        let imgIndex = 0;
        parsedBlocks = rawBlocks.map((b) => {
          if (b.type === 'text') return b;
          const file = req.files?.blockImages?.[imgIndex++];
          return {
            type: 'image',
            value: file?.filename || b.value,
          };
        });
      }

      let devIds = existing.developerIds;
      if (developerIds) {
        try {
          devIds = JSON.parse(developerIds);
        } catch {
          return res
            .status(400)
            .json({ error: 'Неверный формат developerIds' });
        }
      }

      let catIds = existing.categoryIds;
      if (categoryIds) {
        try {
          catIds = JSON.parse(categoryIds);
        } catch {
          return res.status(400).json({ error: 'Неверный формат categoryIds' });
        }
      }

      // Обновление записи
      const updated = await prisma.case.update({
        where: { id },
        data: {
          title: title?.trim() || existing.title,
          price: price ? parseInt(price, 10) : existing.price,
          link: link !== undefined ? link : existing.link,
          date: date ? new Date(date) : existing.date,
          positionTop: positionTop ?? existing.positionTop,
          taskDescription: taskDescription ?? existing.taskDescription,
          clientDescription: clientDescription ?? existing.clientDescription,
          serviceDescription: serviceDescription ?? existing.serviceDescription,
          shop: shop !== undefined ? shop === 'true' : existing.shop,
          developerIds: devIds,
          categoryIds: catIds,
          preview: req.files?.preview?.[0]?.filename || existing.preview,
          images:
            req.files?.images?.length > 0
              ? req.files.images.map((f) => f.filename)
              : existing.images,
          contentBlocks: parsedBlocks,
        },
      });

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка при обновлении кейса' });
    }
  }
);

// 🔹 Удалить кейс
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Кейс не найден' });

  // Удаляем все файлы: preview, images и блоковые картинки
  if (existing.preview) safeUnlink(existing.preview);
  (existing.images || []).forEach(safeUnlink);
  (existing.contentBlocks || [])
    .filter((b) => b.type === 'image' && b.value)
    .forEach((b) => safeUnlink(b.value));

  await prisma.case.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
