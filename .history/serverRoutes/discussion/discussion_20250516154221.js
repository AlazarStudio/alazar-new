const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получить все заявки
router.get('/', async (req, res) => {
  const data = await prisma.discussion.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});

// Добавить заявку
router.post('/', async (req, res) => {
  const { name, phone, email, company, budget, message } = req.body;

  try {
    const newItem = await prisma.discussion.create({
      data: { name, phone, email, company, budget: Number(budget), message },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при создании заявки' });
  }
});

// Удалить заявку
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.discussion.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Не найдено' });
  }
});

module.exports = router;
