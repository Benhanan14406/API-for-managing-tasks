// Express setup
const express = require('express');
const { PrismaClient } = require('./generated/prisma');
const { z } = require('zod');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Validation
const taskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    category: z.string().optional(),
    priority: z.string(['Low', 'Medium', 'High']),
    deadline: z.string().datetime(),
});

// POST /tasks
app.post('/tasks', async (req, res) => {
    try {
      const data = taskSchema.parse(req.body);
      const task = await prisma.task.create({ data });
      res.json(task);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
});

// GET /tasks
app.get('/tasks', async (req, res) => {
    const { category, priority, deadlineFrom, deadlineTo, sortBy = 'createdAt', sortOrder = 'asc' } = req.query;
  
    const where = {
      ...(category && { category }),
      ...(priority && { priority }),
      ...(deadlineFrom || deadlineTo) && {
        deadline: {
          ...(deadlineFrom && { gte: new Date(deadlineFrom) }),
          ...(deadlineTo && { lte: new Date(deadlineTo) }),
        },
      },
    };
  
    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  
    res.json(tasks);
});

app.get('/tasks/:id', async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: Number(req.params.id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

app.put('/tasks/:id', async (req, res) => {
    try {
        const data = taskSchema.parse(req.body);
        const task = await prisma.task.update({ where: { id: Number(req.params.id) }, data });
        res.json(task);
    } catch (err) {
        res.status(err.code === 'P2025' ? 404 : 400).json({ error: err.message });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        await prisma.task.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err) {
        res.status(404).json({ error: 'Task not found' });
    }
});

// Start server
app.listen(3000, () => {
  console.log('Custom API is running on http://localhost:3000');
});