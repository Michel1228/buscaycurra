const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'buscaycurra-secret-key-change-in-production';

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const checkPlan = (requiredPlan) => {
  const planLevels = { FREE: 0, PRO: 1, PREMIUM: 2 };
  
  return (req, res, next) => {
    const userLevel = planLevels[req.user.plan] || 0;
    const requiredLevel = planLevels[requiredPlan] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: `Necesitas el plan ${requiredPlan} para esta función`,
        currentPlan: req.user.plan,
        requiredPlan 
      });
    }
    next();
  };
};

// Límites diarios por plan
const getDailyLimit = (plan) => {
  const limits = { FREE: 2, PRO: 10, PREMIUM: 20 };
  return limits[plan] || 2;
};

module.exports = { authenticate, checkPlan, getDailyLimit, JWT_SECRET };
