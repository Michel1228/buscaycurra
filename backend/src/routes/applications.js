const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, getDailyLimit } = require('../middleware/auth');
const { generateCustomCoverLetter } = require('../services/ai');

const prisma = new PrismaClient();

// POST /api/applications — Enviar CV a una empresa/oferta
router.post('/', authenticate, async (req, res) => {
  try {
    const { cvId, jobId, companyName, companyEmail } = req.body;

    // Verificar límite diario
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await prisma.application.count({
      where: {
        userId: req.user.id,
        sentAt: { gte: today }
      }
    });

    const dailyLimit = getDailyLimit(req.user.plan);
    if (todayCount >= dailyLimit) {
      return res.status(429).json({
        error: `Has alcanzado tu límite diario de ${dailyLimit} envíos`,
        currentPlan: req.user.plan,
        todaySent: todayCount,
        limit: dailyLimit,
        upgrade: req.user.plan !== 'PREMIUM'
      });
    }

    // Verificar que el CV existe y es del usuario
    const cv = await prisma.cV.findFirst({
      where: { id: cvId, userId: req.user.id }
    });
    if (!cv) return res.status(404).json({ error: 'CV no encontrado' });

    // Obtener datos de la oferta si hay jobId
    let job = null;
    let finalCompanyName = companyName;
    let finalCompanyEmail = companyEmail;
    
    if (jobId) {
      job = await prisma.jobListing.findUnique({ where: { id: jobId } });
      if (job) {
        finalCompanyName = finalCompanyName || job.company || 'Empresa';
        finalCompanyEmail = finalCompanyEmail || job.contactEmail;
      }
    }

    // Generar carta personalizada para esta empresa
    const customCoverLetter = await generateCustomCoverLetter(
      cvId, 
      finalCompanyName, 
      job?.title || cv.targetPosition
    );

    // Crear registro de aplicación
    const application = await prisma.application.create({
      data: {
        userId: req.user.id,
        cvId,
        jobId: jobId || null,
        companyName: finalCompanyName,
        companyEmail: finalCompanyEmail || null,
        coverLetter: customCoverLetter
      }
    });

    // TODO: Aquí irá el envío real por email (nodemailer)
    // Por ahora solo registramos la intención

    res.status(201).json({
      message: `¡CV enviado a ${finalCompanyName}! 🚀`,
      application: {
        id: application.id,
        companyName: application.companyName,
        sentAt: application.sentAt,
        status: application.status
      },
      remaining: dailyLimit - todayCount - 1
    });
  } catch (error) {
    console.error('Error enviando aplicación:', error);
    res.status(500).json({ error: 'Error al enviar la aplicación' });
  }
});

// GET /api/applications — Historial de envíos del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: { userId: req.user.id },
        include: { 
          cv: { select: { fullName: true, targetPosition: true } },
          job: { select: { title: true, company: true } }
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.application.count({ where: { userId: req.user.id } })
    ]);

    // Info del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.application.count({
      where: { userId: req.user.id, sentAt: { gte: today } }
    });

    res.json({
      applications,
      daily: {
        sent: todayCount,
        limit: getDailyLimit(req.user.plan),
        remaining: getDailyLimit(req.user.plan) - todayCount
      },
      pagination: {
        page: parseInt(page),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

module.exports = router;
