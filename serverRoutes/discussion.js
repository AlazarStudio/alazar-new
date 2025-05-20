import { Router } from 'express';
const router = Router();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Получить все заявки, отсортированные по дате создания (новые первыми)
router.get('/', async (req, res) => {
  try {
    const data = await prisma.discussion.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Добавить новую заявку
router.post('/', async (req, res) => {
  const { name, phone, email, company, budget, message } = req.body;

  try {
    const newItem = await prisma.discussion.create({
      data: {
        name,
        phone,
        email,
        company,
        budget: Number(budget),
        message,
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при создании заявки' });
  }
});

// Удалить заявку по ID
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await prisma.discussion.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Заявка не найдена' });
  }
});

export default router;
