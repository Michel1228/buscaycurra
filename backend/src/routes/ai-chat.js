const express = require('express');
const router = express.Router();

let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (e) {}

const SYSTEM_PROMPT = `Eres el asistente de BuscayCurra, una app española de búsqueda de empleo con IA.
Tu trabajo es ayudar a los usuarios con:
- Mejorar su CV y carta de presentación
- Consejos para entrevistas de trabajo
- Información sobre sectores laborales en España
- Cómo destacar en una candidatura
- Consejos de búsqueda de empleo

Reglas:
- SIEMPRE responde en español
- Sé directo, útil y motivador
- Respuestas cortas (max 150 palabras) a menos que pidan detalle
- Si preguntan algo no relacionado con empleo, redirige amablemente
- Nunca inventes datos de empresas específicas
- Usa un tono cercano pero profesional`;

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

    if (!groq) {
      return res.json({
        reply: '¡Hola! El asistente IA está en modo básico. Puedo ayudarte con tu CV — ve a la sección "Crear/Mejorar mi CV" para que la IA lo optimice automáticamente.'
      });
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const reply = response.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
    res.json({ reply });
  } catch (e) {
    console.error('AI Chat error:', e.message);
    res.json({ reply: 'Ups, algo falló. Inténtalo de nuevo en unos segundos.' });
  }
});

module.exports = router;
