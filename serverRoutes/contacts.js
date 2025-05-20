import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить текущие контакты (самая последняя запись)
router.get('/', async (_req, res) => {
  const data = await prisma.contact.findMany({
    take: 1,
    orderBy: { createdAt: 'desc' }
  });
  res.json(data[0] || null);
});

// Обновить контакты по ID
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { address, phone, telegram, instagram, vk, email, map } = req.body;

  try {
    const updated = await prisma.contact.update({
      where: { id },
      data: { address, phone, telegram, instagram, vk, email, map }
    });
    res.json(updated);
  } catch (error) {
    res.status(404).json({ error: 'Контакт не найден' });
  }
});

// Добавить новые контакты
router.post('/', async (req, res) => {
  const { address, phone, telegram, instagram, vk, email, map } = req.body;

  try {
    const created = await prisma.contact.create({
      data: { address, phone, telegram, instagram, vk, email, map }
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при добавлении контактов' });
  }
});

export default router;
