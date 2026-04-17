const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Groq es opcional — si no hay key, el CV se crea sin mejora IA
let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('✅ Groq IA conectada');
  } else {
    console.log('⚠️ GROQ_API_KEY no configurada — IA desactivada');
  }
} catch (e) {
  console.log('⚠️ Groq no disponible:', e.message);
}

// Tips por sector — lo que realmente funciona
const SECTOR_TIPS = {
  HOSTELERIA: {
    keySkills: ['Atención al cliente', 'Trabajo en equipo', 'Rapidez', 'Gestión de estrés', 'Limpieza e higiene'],
    tone: 'cercano y orientado al servicio',
    photoStyle: 'cercana y sonriente, fondo neutro',
    coverLetterFocus: 'don de gentes, disponibilidad horaria, experiencia con público'
  },
  INDUSTRIA: {
    keySkills: ['Trabajo en equipo', 'Puntualidad', 'Resistencia física', 'Manejo de maquinaria', 'Seguridad laboral'],
    tone: 'serio y orientado a resultados',
    photoStyle: 'profesional y seria',
    coverLetterFocus: 'fiabilidad, experiencia práctica, capacidad de producción'
  },
  OFICINA: {
    keySkills: ['Microsoft Office', 'Organización', 'Comunicación', 'Gestión de tiempo', 'Atención al detalle'],
    tone: 'formal y profesional',
    photoStyle: 'formal con fondo corporativo',
    coverLetterFocus: 'capacidad organizativa, habilidades informáticas, proactividad'
  },
  COMERCIO: {
    keySkills: ['Ventas', 'Atención al cliente', 'Persuasión', 'Gestión de caja', 'Merchandising'],
    tone: 'dinámico y orientado a ventas',
    photoStyle: 'profesional y amigable',
    coverLetterFocus: 'habilidades comerciales, orientación al cliente, capacidad de cierre'
  },
  TECNOLOGIA: {
    keySkills: ['Programación', 'Resolución de problemas', 'Trabajo remoto', 'Metodologías ágiles', 'Aprendizaje continuo'],
    tone: 'técnico pero accesible',
    photoStyle: 'casual profesional',
    coverLetterFocus: 'habilidades técnicas, proyectos realizados, capacidad de aprendizaje'
  },
  SALUD: {
    keySkills: ['Empatía', 'Trabajo bajo presión', 'Higiene', 'Atención al paciente', 'Trabajo en equipo'],
    tone: 'empático y profesional',
    photoStyle: 'profesional y confiable',
    coverLetterFocus: 'vocación de servicio, experiencia sanitaria, certificaciones'
  },
  CONSTRUCCION: {
    keySkills: ['Resistencia física', 'Trabajo en equipo', 'Puntualidad', 'Seguridad laboral', 'Manejo de herramientas'],
    tone: 'directo y práctico',
    photoStyle: 'profesional y seria',
    coverLetterFocus: 'experiencia práctica, fiabilidad, capacidad física'
  }
};

const DEFAULT_TIPS = {
  keySkills: ['Trabajo en equipo', 'Responsabilidad', 'Puntualidad', 'Ganas de aprender', 'Flexibilidad'],
  tone: 'profesional y motivado',
  photoStyle: 'profesional',
  coverLetterFocus: 'motivación, ganas de trabajar, disponibilidad'
};

async function enhanceCVWithAI(cvId) {
  const cv = await prisma.cV.findUnique({ where: { id: cvId } });
  if (!cv) throw new Error('CV no encontrado');

  const sectorTips = SECTOR_TIPS[cv.targetSector] || DEFAULT_TIPS;

  // Si no hay IA, usar defaults del sector
  if (!groq) {
    await prisma.cV.update({
      where: { id: cvId },
      data: {
        summary: `Profesional motivado/a del sector ${cv.targetSector.toLowerCase()}, buscando oportunidades como ${cv.targetPosition}.`,
        coverLetter: `Estimado/a responsable de selección,\n\nMe dirijo a ustedes para expresar mi interés en la posición de ${cv.targetPosition}. Cuento con experiencia en el sector y gran motivación.\n\nQuedo a su disposición.\n\nAtentamente,\n${cv.fullName}`,
        skills: sectorTips.keySkills
      }
    });
    return { summary: 'Default', coverLetter: 'Default', skills: sectorTips.keySkills };
  }

  // 1. Generar resumen profesional
  const summaryPrompt = `Eres un experto en RRHH español. Genera un resumen profesional de 3-4 líneas para un CV.
Datos del candidato:
- Nombre: ${cv.fullName}
- Puesto buscado: ${cv.targetPosition}
- Sector: ${cv.targetSector}
- Experiencia: ${JSON.stringify(cv.experience)}
- Educación: ${JSON.stringify(cv.education)}

Tono: ${sectorTips.tone}
Habilidades clave del sector: ${sectorTips.keySkills.join(', ')}

IMPORTANTE: Escribe directamente el resumen, sin explicaciones. En español. Máximo 4 líneas. 
Debe sonar natural y profesional, no genérico.`;

  const summaryResponse = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: summaryPrompt }],
    max_tokens: 300,
    temperature: 0.7
  });

  const summary = summaryResponse.choices[0]?.message?.content || '';

  // 2. Generar carta de presentación
  const coverLetterPrompt = `Eres un experto en RRHH español. Genera una carta de presentación profesional.
Datos:
- Nombre: ${cv.fullName}
- Puesto buscado: ${cv.targetPosition}
- Sector: ${cv.targetSector}
- Resumen: ${summary}

Tono: ${sectorTips.tone}
Enfoque: ${sectorTips.coverLetterFocus}

IMPORTANTE: 
- Escribe directamente la carta, sin explicaciones
- En español
- Máximo 200 palabras
- Incluye saludo y despedida
- Debe parecer escrita por una persona real, no por IA
- Adapta el lenguaje al sector`;

  const coverResponse = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: coverLetterPrompt }],
    max_tokens: 500,
    temperature: 0.7
  });

  const coverLetter = coverResponse.choices[0]?.message?.content || '';

  // 3. Sugerir habilidades si no tiene
  let enhancedSkills = cv.skills || [];
  if (enhancedSkills.length === 0) {
    enhancedSkills = sectorTips.keySkills;
  }

  // 4. Actualizar CV en BD
  await prisma.cV.update({
    where: { id: cvId },
    data: {
      summary,
      coverLetter,
      skills: enhancedSkills
    }
  });

  return { summary, coverLetter, skills: enhancedSkills };
}

// Generar carta personalizada para una empresa específica
async function generateCustomCoverLetter(cvId, companyName, jobTitle) {
  const cv = await prisma.cV.findUnique({ where: { id: cvId } });
  if (!cv) throw new Error('CV no encontrado');

  const sectorTips = SECTOR_TIPS[cv.targetSector] || DEFAULT_TIPS;

  if (!groq) {
    return `Estimado/a equipo de ${companyName},\n\nMe dirijo a ustedes para expresar mi interés en la posición de ${jobTitle}. ${cv.summary || ''}\n\nQuedo a su disposición.\n\nAtentamente,\n${cv.fullName}`;
  }

  const prompt = `Genera una carta de presentación personalizada para:
- Candidato: ${cv.fullName}
- Empresa: ${companyName}
- Puesto: ${jobTitle}
- Sector: ${cv.targetSector}
- Experiencia: ${JSON.stringify(cv.experience)}
- Resumen: ${cv.summary}

Tono: ${sectorTips.tone}
Enfoque: ${sectorTips.coverLetterFocus}

IMPORTANTE: Personaliza mencionando el nombre de la empresa. 
Máximo 200 palabras. En español. Natural, no genérico.`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || '';
}

module.exports = { enhanceCVWithAI, generateCustomCoverLetter, SECTOR_TIPS };
