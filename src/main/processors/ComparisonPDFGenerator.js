const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

class ComparisonPDFGenerator {

  /**
   * Genera el PDF de comparación.
   * @param {string} outputPath - Carpeta de salida
   * @param {string} baseName - Nombre base del rastreo
   * @param {object} comparison - Resultado de ComparisonProcessor
   * @returns {object} { pdfPath }
   */
  async generate(outputPath, baseName, comparison) {
    const pdfPath = path.join(outputPath, `${baseName}_comparison.pdf`);

    await this._buildPDF(pdfPath, comparison, baseName);

    Logger.success('PDF de comparación generado', { pdfPath });
    return { pdfPath };
  }

  async _buildPDF(pdfPath, comparison, baseName) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        const domain = baseName.split('_')[0];

        this._header(doc, domain, comparison.summary);
        this._summarySection(doc, comparison.summary);

        // URLs Nuevas
        if (comparison.details.added.length > 0) {
          this._addedSection(doc, comparison.details.added);
        }

        // URLs Eliminadas
        if (comparison.details.removed.length > 0) {
          this._removedSection(doc, comparison.details.removed);
        }

        // URLs con Cambios
        if (comparison.details.changed.length > 0) {
          this._changedSection(doc, comparison.details.changed);
        }

        this._footer(doc);

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ──────────────────────────────────────────
  // Secciones del PDF
  // ──────────────────────────────────────────

  _header(doc, domain, summary) {
    doc.fontSize(24).fillColor('#1e40af')
       .text('Informe de Comparación', { align: 'center' })
       .moveDown(0.3);

    doc.fontSize(16).fillColor('#475569')
       .text(domain, { align: 'center' })
       .moveDown(0.8);

    // Fechas
    doc.fontSize(10).fillColor('#64748b');
    doc.text(`Rastreo anterior: ${summary.previousDate}`, { align: 'center' });
    doc.text(`Rastreo actual: ${summary.currentDate}`, { align: 'center' });
    doc.moveDown(1);

    // Línea separadora
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y)
       .strokeColor('#cbd5e1').stroke();
    doc.moveDown(1);
  }

  _summarySection(doc, summary) {
    doc.fontSize(14).fillColor('#1e293b')
       .text('Resumen Ejecutivo', { underline: true })
       .moveDown(0.5);

    const diffTotal = summary.currentTotal - summary.previousTotal;
    const diffSign = diffTotal >= 0 ? '+' : '';
    const diffPct = summary.previousTotal > 0
      ? ((diffTotal / summary.previousTotal) * 100).toFixed(1)
      : '0';

    doc.fontSize(10).fillColor('#475569');
    doc.text(`URLs en rastreo anterior: ${summary.previousTotal.toLocaleString()}`);
    doc.text(`URLs en rastreo actual: ${summary.currentTotal.toLocaleString()} (${diffSign}${diffTotal})`);
    doc.moveDown(0.5);

    // Cuadro de resumen
    const boxY = doc.y;
    const boxWidth = 160;
    const boxHeight = 80;
    const startX = 40;

    // Nuevas
    doc.save();
    doc.rect(startX, boxY, boxWidth, boxHeight).fill('#dcfce7');
    doc.fontSize(9).fillColor('#166534')
       .text('URLs NUEVAS', startX + 10, boxY + 10, { width: boxWidth - 20 });
    doc.fontSize(24).fillColor('#15803d')
       .text(summary.added.toString(), startX + 10, boxY + 30, { width: boxWidth - 20 });
    doc.restore();

    // Eliminadas
    doc.save();
    doc.rect(startX + boxWidth + 10, boxY, boxWidth, boxHeight).fill('#fee2e2');
    doc.fontSize(9).fillColor('#991b1b')
       .text('URLs ELIMINADAS', startX + boxWidth + 20, boxY + 10, { width: boxWidth - 20 });
    doc.fontSize(24).fillColor('#dc2626')
       .text(summary.removed.toString(), startX + boxWidth + 20, boxY + 30, { width: boxWidth - 20 });
    doc.restore();

    // Con cambios
    doc.save();
    doc.rect(startX + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight).fill('#fef3c7');
    doc.fontSize(9).fillColor('#92400e')
       .text('URLs CON CAMBIOS', startX + (boxWidth + 10) * 2 + 10, boxY + 10, { width: boxWidth - 20 });
    doc.fontSize(24).fillColor('#d97706')
       .text(summary.changed.toString(), startX + (boxWidth + 10) * 2 + 10, boxY + 30, { width: boxWidth - 20 });
    doc.restore();

    doc.y = boxY + boxHeight + 20;
  }

  _addedSection(doc, added) {
    this._checkPageBreak(doc, 150);

    doc.fontSize(14).fillColor('#15803d')
       .text(`URLs Nuevas (${added.length})`, { underline: true })
       .moveDown(0.5);

    this._urlTable(doc, added, '#dcfce7', 15);
  }

  _removedSection(doc, removed) {
    this._checkPageBreak(doc, 150);

    doc.fontSize(14).fillColor('#dc2626')
       .text(`URLs Eliminadas (${removed.length})`, { underline: true })
       .moveDown(0.5);

    this._urlTable(doc, removed, '#fee2e2', 15);
  }

  _changedSection(doc, changed) {
    this._checkPageBreak(doc, 150);

    doc.fontSize(14).fillColor('#d97706')
       .text(`URLs con Cambios (${changed.length})`, { underline: true })
       .moveDown(0.5);

    // Mostrar cada URL con sus cambios
    const maxToShow = 30; // Limitar para no hacer el PDF demasiado largo
    const toShow = changed.slice(0, maxToShow);

    for (const item of toShow) {
      this._checkPageBreak(doc, 80);

      // URL
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold')
         .text(this._truncate(item.url, 80), 40, doc.y)
         .font('Helvetica');
      doc.moveDown(0.3);

      // Tabla de cambios
      const tableX = 50;
      const colWidths = [130, 170, 170];
      const rowH = 16;
      let y = doc.y;

      // Header
      doc.save();
      doc.rect(tableX, y, colWidths[0] + colWidths[1] + colWidths[2], rowH).fill('#f1f5f9');
      doc.fontSize(7).fillColor('#475569').font('Helvetica-Bold');
      doc.text('Campo', tableX + 4, y + 4, { width: colWidths[0] - 8 });
      doc.text('Antes', tableX + colWidths[0] + 4, y + 4, { width: colWidths[1] - 8 });
      doc.text('Ahora', tableX + colWidths[0] + colWidths[1] + 4, y + 4, { width: colWidths[2] - 8 });
      doc.restore();
      y += rowH;

      // Filas de cambios
      doc.font('Helvetica');
      for (const change of item.changes) {
        if (y > doc.page.height - 80) break;

        doc.fontSize(7).fillColor('#334155');
        doc.text(change.field, tableX + 4, y + 3, { width: colWidths[0] - 8 });
        doc.fillColor('#991b1b')
           .text(this._truncate(change.old, 40), tableX + colWidths[0] + 4, y + 3, { width: colWidths[1] - 8 });
        doc.fillColor('#166534')
           .text(this._truncate(change.new, 40), tableX + colWidths[0] + colWidths[1] + 4, y + 3, { width: colWidths[2] - 8 });
        y += rowH;
      }

      doc.y = y + 10;
    }

    if (changed.length > maxToShow) {
      doc.fontSize(9).fillColor('#64748b')
         .text(`... y ${changed.length - maxToShow} URLs más con cambios`, { align: 'center' });
    }
  }

  _urlTable(doc, urls, headerColor, maxRows) {
    const tableX = 40;
    const colWidths = [280, 50, 100];
    const rowH = 16;
    let y = doc.y;

    // Header
    doc.save();
    doc.rect(tableX, y, colWidths[0] + colWidths[1] + colWidths[2], rowH).fill(headerColor);
    doc.fontSize(8).fillColor('#1e293b').font('Helvetica-Bold');
    doc.text('URL', tableX + 4, y + 4, { width: colWidths[0] - 8 });
    doc.text('Status', tableX + colWidths[0] + 4, y + 4, { width: colWidths[1] - 8 });
    doc.text('Title', tableX + colWidths[0] + colWidths[1] + 4, y + 4, { width: colWidths[2] - 8 });
    doc.restore();
    y += rowH;

    // Filas
    const toShow = urls.slice(0, maxRows);
    doc.font('Helvetica');
    let alt = false;

    for (const row of toShow) {
      if (y > doc.page.height - 60) break;

      const bg = alt ? '#f8fafc' : '#ffffff';
      doc.save();
      doc.rect(tableX, y, colWidths[0] + colWidths[1] + colWidths[2], rowH).fill(bg);
      doc.fontSize(7).fillColor('#334155');
      doc.text(this._truncate(row.url, 60), tableX + 4, y + 4, { width: colWidths[0] - 8, lineBreak: false });
      doc.text(row.statusCode || '', tableX + colWidths[0] + 4, y + 4, { width: colWidths[1] - 8, lineBreak: false });
      doc.text(this._truncate(row.title || '', 25), tableX + colWidths[0] + colWidths[1] + 4, y + 4, { width: colWidths[2] - 8, lineBreak: false });
      doc.restore();

      y += rowH;
      alt = !alt;
    }

    if (urls.length > maxRows) {
      doc.y = y + 5;
      doc.fontSize(8).fillColor('#64748b')
         .text(`... y ${urls.length - maxRows} URLs más`, { align: 'center' });
    }

    doc.y = y + 15;
  }

  _footer(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.page.margins.bottom = 30;
      doc.x = 40;
      doc.y = doc.page.height - 40;
      doc.fontSize(8).fillColor('#94a3b8')
         .text('Generado por Screaming Frog Automation', { align: 'center', width: doc.page.width - 80 });
    }
  }

  // ──────────────────────────────────────────
  // Utilidades
  // ──────────────────────────────────────────

  _checkPageBreak(doc, neededSpace) {
    if (doc.y + neededSpace > doc.page.height - 60) {
      doc.addPage();
    }
  }

  _truncate(str, maxLen) {
    if (!str) return '';
    str = String(str);
    return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
  }
}

module.exports = new ComparisonPDFGenerator();
