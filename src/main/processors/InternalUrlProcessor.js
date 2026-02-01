const ExcelJS = require('exceljs');
const path = require('path');
const Logger = require('../utils/Logger');
const PathManager = require('../utils/PathManager');

// Clasificadores de URL por tipo de recurso
const CLASSIFIERS = [
  {
    name: 'images',
    test: (url, ct) =>
      ct.includes('image') ||
      /\.(jpg|jpeg|png|gif|svg|webp|ico|bmp)(\?|#|$)/i.test(url)
  },
  {
    name: 'css',
    test: (url, ct) =>
      ct.includes('css') ||
      /\.css(\?|#|$)/i.test(url)
  },
  {
    name: 'javascript',
    test: (url, ct) =>
      ct.includes('javascript') || ct.includes('ecmascript') ||
      /\.(js|jsx|mjs)(\?|#|$)/i.test(url)
  },
  {
    name: 'pdf',
    test: (url, ct) =>
      ct.includes('pdf') ||
      /\.pdf(\?|#|$)/i.test(url)
  },
  {
    name: 'fonts',
    test: (url, ct) =>
      ct.includes('font') ||
      /\.(woff|woff2|ttf|eot|otf)(\?|#|$)/i.test(url)
  },
  {
    name: 'videos',
    test: (url, ct) =>
      ct.includes('video') ||
      /\.(mp4|webm|ogg|avi|mov)(\?|#|$)/i.test(url)
  },
  {
    name: 'documents',
    test: (url) =>
      /\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv)(\?|#|$)/i.test(url)
  },
  {
    name: 'html',
    test: (url, ct) =>
      ct.includes('html') ||
      /\.html?(\?|#|$)/i.test(url) ||
      url.endsWith('/')
  }
];

class InternalUrlProcessor {

  /**
   * Procesa el archivo "internal" exportado por SF y genera un Excel organizado por tipo.
   * @returns {object|null} { outputFile, stats } o null si no hay archivo que procesar
   */
  async process(outputPath, baseName) {
    Logger.info('Iniciando procesado de URLs internas', { outputPath });

    // 1. Buscar el archivo internal exportado por SF
    //    SF nombra sus exports como: "internal_all.xlsx" (sin prefijo de proyecto)
    const allXlsx = await PathManager.listFiles(outputPath, '.xlsx');
    const internalFile = allXlsx.find(f => {
      const lower = f.toLowerCase();
      return lower.includes('internal') && !lower.includes('analysis');
    });

    if (!internalFile) {
      Logger.warn('No se encontró archivo internal en la carpeta de salida', { files: allXlsx });
      return null;
    }

    const internalPath = path.join(outputPath, internalFile);
    Logger.info('Procesando archivo internal', { file: internalFile });

    // 2. Leer datos
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(internalPath);
    const rows = this._extractRows(wb);
    Logger.info('Filas extraídas', { count: rows.length });

    // 3. Clasificar
    const classified = this._classify(rows);

    // 4. Escribir nuevo workbook
    const outputwb = new ExcelJS.Workbook();
    this._writeSummarySheet(outputwb, classified, rows.length);
    for (const [type, items] of Object.entries(classified)) {
      if (items.length > 0) {
        this._writeTypeSheet(outputwb, type, items);
      }
    }

    const outputFile = path.join(outputPath, `${baseName}_internal_analysis.xlsx`);
    await outputwb.xlsx.writeFile(outputFile);

    const stats = this._buildStats(classified, rows.length);
    Logger.success('Análisis de internos completado', { outputFile, stats });
    return { outputFile, stats };
  }

  // ──────────────────────────────────────────
  // Extracción
  // ──────────────────────────────────────────

  _extractRows(workbook) {
    const ws = workbook.worksheets[0];
    if (!ws) return [];

    // Detectar columnas por nombre en la primera fila
    const cols = { url: 1, status: 2, contentType: 3 };
    const header = ws.getRow(1);
    header.eachCell((cell, n) => {
      const val = (cell.value || '').toString().toLowerCase().trim();
      if (val === 'address' || val === 'url')              cols.url = n;
      if (val === 'status code' || val === 'status')       cols.status = n;
      if (val === 'content type' || val === 'content-type') cols.contentType = n;
    });

    const rows = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return; // skip header
      const url = row.getCell(cols.url).value;
      if (!url) return;
      rows.push({
        url:         String(url),
        statusCode:  row.getCell(cols.status).value || 200,
        contentType: row.getCell(cols.contentType).value ? String(row.getCell(cols.contentType).value) : 'text/html'
      });
    });

    return rows;
  }

  // ──────────────────────────────────────────
  // Clasificación
  // ──────────────────────────────────────────

  _classify(rows) {
    // Inicializar todas las categorías
    const result = {};
    for (const c of CLASSIFIERS) result[c.name] = [];
    result.otros = [];

    for (const row of rows) {
      const url = row.url.toLowerCase();
      const ct  = row.contentType.toLowerCase();
      let matched = false;

      for (const classifier of CLASSIFIERS) {
        if (classifier.test(url, ct)) {
          result[classifier.name].push(row);
          matched = true;
          break; // Primera coincidencia gana
        }
      }

      if (!matched) result.otros.push(row);
    }

    return result;
  }

  // ──────────────────────────────────────────
  // Escritura Excel
  // ──────────────────────────────────────────

  _writeSummarySheet(wb, classified, total) {
    const ws = wb.addWorksheet('Resumen', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'Tipo',       key: 'tipo',       width: 20 },
      { header: 'Cantidad',   key: 'cantidad',   width: 15 },
      { header: 'Porcentaje', key: 'porcentaje', width: 15 }
    ];
    this._styleHeader(ws);

    for (const [type, items] of Object.entries(classified)) {
      const pct = total > 0 ? ((items.length / total) * 100).toFixed(2) : '0.00';
      ws.addRow({ tipo: type.toUpperCase(), cantidad: items.length, porcentaje: `${pct}%` });
    }

    // Fila total
    const totalRow = ws.addRow({ tipo: 'TOTAL', cantidad: total, porcentaje: '100%' });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  }

  _writeTypeSheet(wb, type, items) {
    const ws = wb.addWorksheet(type.toUpperCase(), { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'URL',          key: 'url',         width: 90 },
      { header: 'Status Code',  key: 'statusCode',  width: 15 },
      { header: 'Content Type', key: 'contentType', width: 35 }
    ];
    this._styleHeader(ws);

    for (const item of items) {
      const row = ws.addRow(item);
      // Color según status
      const sc = Number(item.statusCode);
      let color = null;
      if (sc >= 400)      color = 'FFEF4444'; // rojo
      else if (sc >= 300) color = 'FFFBBF24'; // amarillo
      else if (sc === 200) color = 'FF22C55E'; // verde

      if (color) {
        row.getCell('statusCode').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        if (sc >= 400) row.getCell('statusCode').font = { color: { argb: 'FFFFFFFF' } };
      }
    }
  }

  _styleHeader(ws) {
    const hdr = ws.getRow(1);
    hdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    hdr.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // ──────────────────────────────────────────
  // Estadísticas
  // ──────────────────────────────────────────

  _buildStats(classified, total) {
    return {
      total,
      byType: Object.entries(classified).map(([type, items]) => ({
        type,
        count: items.length,
        percentage: total > 0 ? ((items.length / total) * 100).toFixed(2) : '0'
      }))
    };
  }
}

module.exports = new InternalUrlProcessor();