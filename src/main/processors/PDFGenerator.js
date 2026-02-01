const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const Logger = require('../utils/Logger');

class PDFGenerator {

  /**
   * Genera el PDF resumen a partir del Excel de análisis.
   * @returns {object|null} { pdfPath } o null si no hay datos
   */
  async generate(outputPath, baseName) {
    const analysisFile = path.join(outputPath, `${baseName}_internal_analysis.xlsx`);

    // Verificar que el archivo de análisis existe
    if (!fs.existsSync(analysisFile)) {
      Logger.warn('PDFGenerator: no existe archivo de análisis', { analysisFile });
      return null;
    }

    const stats = await this._readStats(analysisFile);
    const pdfPath = path.join(outputPath, `${baseName}_informe.pdf`);

    await this._buildPDF(pdfPath, stats, baseName);

    Logger.success('PDF generado', { pdfPath });
    return { pdfPath };
  }

  // ──────────────────────────────────────────
  // Lectura de datos del Excel
  // ──────────────────────────────────────────

  async _readStats(filePath) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.getWorksheet('Resumen');

    const stats = { total: 0, byType: [] };
    if (!ws) return stats;

    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      const tipo = String(row.getCell(1).value || '');
      const cantidad = Number(row.getCell(2).value) || 0;
      const porcentaje = String(row.getCell(3).value || '0%');

      if (tipo === 'TOTAL') {
        stats.total = cantidad;
      } else {
        stats.byType.push({ type: tipo, count: cantidad, percentage: porcentaje });
      }
    });

    return stats;
  }

  // ──────────────────────────────────────────
  // Construcción del PDF
  // ──────────────────────────────────────────

  async _buildPDF(pdfPath, stats, baseName) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        this._header(doc, baseName);
        this._summary(doc, stats);
        this._table(doc, stats);
        this._barChart(doc, stats);
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

  _header(doc, baseName) {
    const domain = baseName.split('_')[0];
    const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    doc.fontSize(26).fillColor('#2563eb')
       .text('Informe de Análisis SEO', { align: 'center' })
       .moveDown(0.4);

    doc.fontSize(15).fillColor('#475569')
       .text(domain, { align: 'center' })
       .moveDown(0.2);

    doc.fontSize(11).fillColor('#94a3b8')
       .text(fecha, { align: 'center' })
       .moveDown(1.5);

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
       .strokeColor('#cbd5e1').stroke()
       .moveDown(1.5);
  }

  _summary(doc, stats) {
    doc.fontSize(17).fillColor('#1e293b')
       .text('Resumen Ejecutivo', { underline: true })
       .moveDown(0.6);

    doc.fontSize(13).fillColor('#2563eb').font('Helvetica-Bold')
       .text(`Total de URLs analizadas: ${stats.total}`)
       .font('Helvetica').moveDown(0.4);

    doc.fontSize(10).fillColor('#475569')
       .text(
         'Este informe presenta un análisis detallado de las URLs internas del sitio web, clasificadas según el tipo de recurso que representan.',
         { align: 'justify' }
       )
       .moveDown(1.5);
  }

  _table(doc, stats) {
    doc.fontSize(17).fillColor('#1e293b')
       .text('Distribución por Tipo', { underline: true })
       .moveDown(1);

    const colWidths = { tipo: 220, cantidad: 100, porcentaje: 100 };
    const rowH = 24;
    const startX = 50;
    let y = doc.y;

    // Header
    doc.save();
    doc.rect(startX, y, colWidths.tipo, rowH).fill('#4472C4');
    doc.rect(startX + colWidths.tipo, y, colWidths.cantidad, rowH).fill('#4472C4');
    doc.rect(startX + colWidths.tipo + colWidths.cantidad, y, colWidths.porcentaje, rowH).fill('#4472C4');

    doc.fontSize(9).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('Tipo', startX + 8, y + 7, { width: colWidths.tipo - 16, lineBreak: false });
    doc.text('Cantidad', startX + colWidths.tipo + 8, y + 7, { width: colWidths.cantidad - 16, lineBreak: false, align: 'center' });
    doc.text('Porcentaje', startX + colWidths.tipo + colWidths.cantidad + 8, y + 7, { width: colWidths.porcentaje - 16, lineBreak: false, align: 'center' });
    doc.restore();

    y += rowH;
    let alt = false;

    // Filas de datos
    for (const item of stats.byType) {
      const bg = alt ? '#F1F5F9' : '#FFFFFF';
      doc.save();
      doc.rect(startX, y, colWidths.tipo, rowH).fill(bg);
      doc.rect(startX + colWidths.tipo, y, colWidths.cantidad, rowH).fill(bg);
      doc.rect(startX + colWidths.tipo + colWidths.cantidad, y, colWidths.porcentaje, rowH).fill(bg);

      doc.fontSize(9).fillColor('#334155').font('Helvetica');
      doc.text(item.type, startX + 8, y + 7, { width: colWidths.tipo - 16, lineBreak: false });
      doc.text(String(item.count), startX + colWidths.tipo + 8, y + 7, { width: colWidths.cantidad - 16, lineBreak: false, align: 'center' });
      doc.text(item.percentage, startX + colWidths.tipo + colWidths.cantidad + 8, y + 7, { width: colWidths.porcentaje - 16, lineBreak: false, align: 'center' });
      doc.restore();

      y += rowH;
      alt = !alt;
    }

    // Fila total
    doc.save();
    doc.rect(startX, y, colWidths.tipo + colWidths.cantidad + colWidths.porcentaje, rowH).fill('#E2E8F0');
    doc.fontSize(9).fillColor('#1E293B').font('Helvetica-Bold');
    doc.text('TOTAL', startX + 8, y + 7, { width: colWidths.tipo - 16, lineBreak: false });
    doc.text(String(stats.total), startX + colWidths.tipo + 8, y + 7, { width: colWidths.cantidad - 16, lineBreak: false, align: 'center' });
    doc.text('100%', startX + colWidths.tipo + colWidths.cantidad + 8, y + 7, { width: colWidths.porcentaje - 16, lineBreak: false, align: 'center' });
    doc.restore();

    doc.y = y + rowH + 30;
  }

  _barChart(doc, stats) {
    // Si no caben las barras en esta página, nueva página
    const neededSpace = 60 + stats.byType.length * 28;
    if (doc.y + neededSpace > doc.page.height - 80) {
      doc.addPage();
    }

    doc.fontSize(17).fillColor('#1e293b')
       .text('Distribución Visual', { underline: true })
       .moveDown(1);

    const maxVal = Math.max(...stats.byType.map(i => i.count), 1);
    const labelW = 100;
    const maxBarW = 350;
    const barH = 18;
    const gap = 8;
    let y = doc.y;

    for (const item of stats.byType) {
      const barW = Math.max((item.count / maxVal) * maxBarW, 2); // mínimo 2px visible

      // Etiqueta
      doc.fontSize(9).fillColor('#475569').font('Helvetica');
      doc.text(item.type, 50, y + 4, { width: labelW - 10, lineBreak: false });

      // Barra
      doc.save();
      doc.rect(50 + labelW, y, barW, barH).fill('#3B82F6');
      doc.restore();

      // Valor a la derecha de la barra
      doc.fontSize(9).fillColor('#475569').font('Helvetica');
      doc.text(String(item.count), 50 + labelW + barW + 6, y + 4, { lineBreak: false });

      y += barH + gap;
    }

    doc.y = y + 10;
  }

  _footer(doc) {
    // Footer en cada página
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.page.margins.bottom = 30;
      doc.x = 50;
      doc.y = doc.page.height - 50;
      doc.fontSize(8).fillColor('#94a3b8')
         .text('Generado por Screaming Frog Automation', { align: 'center', width: doc.page.width - 100 });
    }
  }
}

module.exports = new PDFGenerator();