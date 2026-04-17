const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/jobs — Listar ofertas del tablón (con filtros)
router.get('/', authenticate, async (req, res) => {
  try {
    const { sector, city, province, search, page = 1, limit = 20 } = req.query;
    
    const where = { isActive: true };
    
    if (sector) where.sector = sector;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (province) where.province = { contains: province, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      prisma.jobListing.findMany({
        where,
        orderBy: { scrapedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.jobListing.count({ where })
    ]);

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando ofertas:', error);
    res.status(500).json({ error: 'Error al obtener ofertas' });
  }
});

// GET /api/jobs/:id — Detalle de una oferta
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await prisma.jobListing.findUnique({
      where: { id: req.params.id }
    });
    if (!job) return res.status(404).json({ error: 'Oferta no encontrada' });
    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la oferta' });
  }
});

// POST /api/jobs/:id/save — Guardar oferta
router.post('/:id/save', authenticate, async (req, res) => {
  try {
    const saved = await prisma.savedJob.create({
      data: {
        userId: req.user.id,
        jobId: req.params.id
      }
    });
    res.json({ message: 'Oferta guardada ⭐', saved });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.json({ message: 'Ya tenías esta oferta guardada' });
    }
    res.status(500).json({ error: 'Error al guardar oferta' });
  }
});

// GET /api/jobs/saved — Ofertas guardadas del usuario
router.get('/saved/list', authenticate, async (req, res) => {
  try {
    const saved = await prisma.savedJob.findMany({
      where: { userId: req.user.id },
      include: { job: true },
      orderBy: { savedAt: 'desc' }
    });
    res.json({ savedJobs: saved });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ofertas guardadas' });
  }
});

module.exports = router;
