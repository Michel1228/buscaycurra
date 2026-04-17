const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { enhanceCVWithAI } = require('../services/ai');

const prisma = new PrismaClient();

// Configurar multer para subir fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/photos/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
  }
});

// POST /api/cv — Crear CV (ultra simple: datos mínimos + sector)
router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { 
      fullName, email, phone, city, birthDate,
      targetSector, targetPosition,
      experience, education, skills, languages 
    } = req.body;

    // Crear CV base
    const cv = await prisma.cV.create({
      data: {
        userId: req.user.id,
        fullName: fullName || req.user.name,
        email: email || req.user.email,
        phone: phone || req.user.phone || '',
        city: city || '',
        birthDate: birthDate ? new Date(birthDate) : null,
        targetSector: targetSector || 'OTRO',
        targetPosition: targetPosition || '',
        originalPhoto: req.file ? `/uploads/photos/${req.file.filename}` : null,
        experience: experience ? (typeof experience === 'string' ? JSON.parse(experience) : experience) : [],
        education: education ? (typeof education === 'string' ? JSON.parse(education) : education) : [],
        skills: skills ? (typeof skills === 'string' ? JSON.parse(skills) : skills) : [],
        languages: languages ? (typeof languages === 'string' ? JSON.parse(languages) : languages) : []
      }
    });

    // Mejorar con IA en background
    enhanceCVWithAI(cv.id).catch(err => 
      console.error('Error mejorando CV con IA:', err)
    );

    res.status(201).json({
      message: '¡CV creado! Nuestra IA lo está mejorando... ✨',
      cv: {
        id: cv.id,
        fullName: cv.fullName,
        targetSector: cv.targetSector,
        targetPosition: cv.targetPosition,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error creando CV:', error);
    res.status(500).json({ error: 'Error al crear el CV' });
  }
});

// GET /api/cv — Listar CVs del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const cvs = await prisma.cV.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ cvs });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener CVs' });
  }
});

// GET /api/cv/:id — Detalle de un CV
router.get('/:id', authenticate, async (req, res) => {
  try {
    const cv = await prisma.cV.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!cv) return res.status(404).json({ error: 'CV no encontrado' });
    res.json({ cv });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el CV' });
  }
});

module.exports = router;
