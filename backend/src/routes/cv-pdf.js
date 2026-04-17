const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Colors
const ORANGE = [255, 107, 53];
const DARK = [11, 14, 23];
const GRAY = [100, 110, 130];
const WHITE = [255, 255, 255];
const CYAN = [0, 180, 220];
const SIDEBAR_BG = [18, 22, 35];

router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const cv = await prisma.cV.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!cv) return res.status(404).json({ error: 'CV no encontrado' });

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cv.fullName.replace(/\s/g, '_')}_CV.pdf"`);
    doc.pipe(res);

    const W = 595.28;
    const H = 841.89;
    const SIDE_W = 185;
    const MAIN_X = SIDE_W + 25;
    const MAIN_W = W - MAIN_X - 30;

    // === LEFT SIDEBAR ===
    doc.rect(0, 0, SIDE_W, H).fill(rgbStr(SIDEBAR_BG));

    // Name at top of sidebar
    let sideY = 40;
    doc.font('Helvetica-Bold').fontSize(16).fillColor(rgbStr(WHITE));
    const nameLines = doc.heightOfString(cv.fullName, { width: SIDE_W - 30 });
    doc.text(cv.fullName, 15, sideY, { width: SIDE_W - 30 });
    sideY += nameLines + 6;

    // Position
    if (cv.targetPosition) {
      doc.font('Helvetica').fontSize(10).fillColor(rgbStr(ORANGE));
      doc.text(cv.targetPosition, 15, sideY, { width: SIDE_W - 30 });
      sideY += 18;
    }

    // Divider
    sideY += 8;
    doc.rect(15, sideY, SIDE_W - 30, 1).fill(rgbStr([40, 50, 70]));
    sideY += 16;

    // CONTACTO
    sideY = sidebarSection(doc, 'CONTACTO', sideY, SIDE_W);
    if (cv.phone) { sideY = sidebarItem(doc, `T  ${cv.phone}`, sideY, SIDE_W); }
    if (cv.email) { sideY = sidebarItem(doc, `@  ${cv.email}`, sideY, SIDE_W); }
    if (cv.city) { sideY = sidebarItem(doc, `L  ${cv.city}`, sideY, SIDE_W); }
    sideY += 12;

    // APTITUDES
    const skills = cv.skills || [];
    if (skills.length > 0) {
      sideY = sidebarSection(doc, 'APTITUDES', sideY, SIDE_W);
      skills.forEach(s => {
        sideY = sidebarItem(doc, s, sideY, SIDE_W);
      });
      sideY += 12;
    }

    // IDIOMAS
    const langs = cv.languages || [];
    if (langs.length > 0) {
      sideY = sidebarSection(doc, 'IDIOMAS', sideY, SIDE_W);
      langs.forEach(l => {
        sideY = sidebarItem(doc, l, sideY, SIDE_W);
      });
      sideY += 12;
    }

    // SECTOR
    if (cv.targetSector) {
      sideY = sidebarSection(doc, 'SECTOR', sideY, SIDE_W);
      sideY = sidebarItem(doc, cv.targetSector, sideY, SIDE_W);
    }

    // === MAIN CONTENT ===
    let mainY = 40;

    // PERFIL PROFESIONAL
    if (cv.summary) {
      mainY = mainSection(doc, 'PERFIL PROFESIONAL', mainY, MAIN_X, MAIN_W);
      doc.font('Helvetica').fontSize(9.5).fillColor(rgbStr(GRAY));
      doc.text(cv.summary, MAIN_X, mainY, { width: MAIN_W, lineGap: 3 });
      mainY += doc.heightOfString(cv.summary, { width: MAIN_W, lineGap: 3 }) + 16;
    }

    // EXPERIENCIA LABORAL
    const exps = cv.experience || [];
    if (exps.length > 0) {
      mainY = mainSection(doc, 'EXPERIENCIA LABORAL', mainY, MAIN_X, MAIN_W);
      exps.forEach(e => {
        // Date range
        const dates = `${e.startDate || ''} – ${e.endDate || 'Actual'}`;
        doc.font('Helvetica').fontSize(8.5).fillColor(rgbStr(GRAY));
        doc.text(dates, MAIN_X, mainY, { width: MAIN_W });
        mainY += 13;

        // Position + Company
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(rgbStr(DARK));
        doc.text(e.position || '', MAIN_X, mainY, { width: MAIN_W });
        mainY += 14;
        
        if (e.company) {
          doc.font('Helvetica').fontSize(9).fillColor(rgbStr(ORANGE));
          doc.text(e.company, MAIN_X, mainY, { width: MAIN_W });
          mainY += 13;
        }

        // Description
        if (e.description) {
          doc.font('Helvetica').fontSize(9).fillColor(rgbStr(GRAY));
          const lines = e.description.split('\n').filter(l => l.trim());
          lines.forEach(line => {
            const text = line.trim().startsWith('-') ? line.trim() : line.trim();
            doc.text(text, MAIN_X + 5, mainY, { width: MAIN_W - 10, lineGap: 2 });
            mainY += doc.heightOfString(text, { width: MAIN_W - 10, lineGap: 2 }) + 2;
          });
        }
        mainY += 10;
      });
    }

    // FORMACIÓN
    const edus = cv.education || [];
    if (edus.length > 0) {
      mainY = mainSection(doc, 'FORMACIÓN', mainY, MAIN_X, MAIN_W);
      edus.forEach(e => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(rgbStr(DARK));
        doc.text(e.degree || e.title || '', MAIN_X, mainY, { width: MAIN_W });
        mainY += 14;
        
        const meta = [e.institution, e.year].filter(Boolean).join(' · ');
        if (meta) {
          doc.font('Helvetica').fontSize(9).fillColor(rgbStr(GRAY));
          doc.text(meta, MAIN_X, mainY, { width: MAIN_W });
          mainY += 13;
        }
        mainY += 6;
      });
    }

    // Footer
    doc.font('Helvetica').fontSize(7).fillColor(rgbStr([80, 90, 110]));
    doc.text(
      `${cv.fullName} · ${cv.phone || ''} · ${cv.email || ''} · ${cv.city || ''}`,
      MAIN_X, H - 30, { width: MAIN_W, align: 'left' }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

// Helpers
function rgbStr(arr) { return `#${arr.map(c => c.toString(16).padStart(2, '0')).join('')}`; }

function sidebarSection(doc, title, y, sideW) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(rgbStr(ORANGE));
  doc.text(title, 15, y, { width: sideW - 30 });
  y += 16;
  return y;
}

function sidebarItem(doc, text, y, sideW) {
  doc.font('Helvetica').fontSize(8.5).fillColor(rgbStr([180, 190, 210]));
  doc.text(text, 15, y, { width: sideW - 30 });
  y += doc.heightOfString(text, { width: sideW - 30 }) + 4;
  return y;
}

function mainSection(doc, title, y, x, w) {
  doc.font('Helvetica-Bold').fontSize(12).fillColor(rgbStr(DARK));
  doc.text(title, x, y, { width: w });
  y += 16;
  doc.rect(x, y, 50, 2.5).fill(rgbStr(ORANGE));
  y += 12;
  return y;
}

module.exports = router;
