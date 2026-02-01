const ExcelJS = require('exceljs');
const path = require('path');
const Logger = require('../utils/Logger');
const PathManager = require('../utils/PathManager');

// Campos a comparar entre rastreos
const COMPARISON_FIELDS = [
  { key: 'statusCode', label: 'Status Code', column: 'status code' },
  { key: 'indexability', label: 'Indexability', column: 'indexability' },
  { key: 'indexabilityStatus', label: 'Indexability Status', column: 'indexability status' },
  { key: 'title', label: 'Title 1', column: 'title 1' },
  { key: 'metaDescription', label: 'Meta Description 1', column: 'meta description 1' },
  { key: 'h1', label: 'H1-1', column: 'h1-1' },
  { key: 'h1_2', label: 'H1-2', column: 'h1-2' },
  { key: 'metaRobots', label: 'Meta Robots 1', column: 'meta robots 1' },
  { key: 'canonical', label: 'Canonical Link Element 1', column: 'canonical link element 1' },
  { key: 'size', label: 'Size (bytes)', column: 'size (bytes)' },
  { key: 'wordCount', label: 'Word Count', column: 'word count' },
  { key: 'crawlDepth', label: 'Crawl Depth', column: 'crawl depth' },
  { key: 'redirectUrl', label: 'Redirect URL', column: 'redirect url' },
  { key: 'redirectType', label: 'Redirect Type', column: 'redirect type' },
  { key: 'richResults', label: 'Rich Results Types', column: 'rich results types' }
];

class ComparisonProcessor {

  /**
   * Compara dos rastreos y retorna las diferencias.
   * @param {string} currentPath - Ruta a la carpeta del rastreo actual
   * @param {object} previousCrawl - { path, folderName, timestamp } del rastreo anterior
   * @param {string} baseName - Nombre base del rastreo actual
   * @returns {object|null} - Resultado de la comparación o null si falla
   */
  async compare(currentPath, previousCrawl, baseName) {
    Logger.info('Iniciando comparación de rastreos', {
      current: currentPath,
      previous: previousCrawl.path
    });

    try {
      // 1. Encontrar archivos Internal en ambas carpetas
      const currentFile = await this._findInternalFile(currentPath);
      const previousFile = await this._findInternalFile(previousCrawl.path);

      if (!currentFile || !previousFile) {
        Logger.warn('No se encontraron archivos Internal para comparar');
        return null;
      }

      // 2. Leer ambos archivos
      const currentData = await this._readInternalFile(currentFile);
      const previousData = await this._readInternalFile(previousFile);

      Logger.info('Datos leídos', {
        currentRows: currentData.size,
        previousRows: previousData.size
      });

      // 3. Comparar
      const result = this._compareData(previousData, currentData, previousCrawl, baseName);

      Logger.success('Comparación completada', {
        added: result.summary.added,
        removed: result.summary.removed,
        changed: result.summary.changed
      });

      return result;

    } catch (e) {
      Logger.error('Error en comparación', e);
      return null;
    }
  }

  /**
   * Busca el archivo Internal:All en una carpeta
   */
  async _findInternalFile(folderPath) {
    const files = await PathManager.listFiles(folderPath, '.xlsx');
    const internalFile = files.find(f => {
      const lower = f.toLowerCase();
      return lower.includes('internal') && !lower.includes('analysis') && !lower.includes('comparison');
    });

    if (!internalFile) return null;
    return path.join(folderPath, internalFile);
  }

  /**
   * Lee un archivo Internal y retorna un Map de URL -> datos
   */
  async _readInternalFile(filePath) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);

    const ws = wb.worksheets[0];
    if (!ws) return new Map();

    // Detectar columnas por nombre en la cabecera
    const columnMap = {};
    const header = ws.getRow(1);

    // Encontrar columna de URL/Address
    let urlColumn = 1;
    header.eachCell((cell, colNum) => {
      const val = (cell.value || '').toString().toLowerCase().trim();
      if (val === 'address' || val === 'url') {
        urlColumn = colNum;
      }
      // Mapear todas las columnas de comparación (coincidencia exacta)
      for (const field of COMPARISON_FIELDS) {
        if (val === field.column) {
          columnMap[field.key] = colNum;
        }
      }
    });

    // Leer filas
    const dataMap = new Map();
    ws.eachRow((row, idx) => {
      if (idx === 1) return; // skip header

      const url = row.getCell(urlColumn).value;
      if (!url) return;

      const urlStr = String(url).toLowerCase().trim();
      const rowData = { url: String(url) };

      for (const field of COMPARISON_FIELDS) {
        const colNum = columnMap[field.key];
        if (colNum) {
          const cellValue = row.getCell(colNum).value;
          rowData[field.key] = cellValue !== null && cellValue !== undefined
            ? String(cellValue).trim()
            : '';
        } else {
          rowData[field.key] = '';
        }
      }

      dataMap.set(urlStr, rowData);
    });

    return dataMap;
  }

  /**
   * Compara dos mapas de datos y retorna las diferencias
   */
  _compareData(previousData, currentData, previousCrawl, baseName) {
    const added = [];
    const removed = [];
    const changed = [];

    // Extraer timestamps para el resumen
    const currentTimestamp = baseName.split('_').slice(1).join('_');
    const previousTimestamp = previousCrawl.timestamp;

    // URLs añadidas (en current pero no en previous)
    for (const [url, data] of currentData) {
      if (!previousData.has(url)) {
        added.push(data);
      }
    }

    // URLs eliminadas (en previous pero no en current)
    for (const [url, data] of previousData) {
      if (!currentData.has(url)) {
        removed.push(data);
      }
    }

    // URLs con cambios (en ambos pero con diferencias)
    for (const [url, currentRow] of currentData) {
      if (previousData.has(url)) {
        const previousRow = previousData.get(url);
        const changes = [];

        for (const field of COMPARISON_FIELDS) {
          const oldVal = previousRow[field.key] || '';
          const newVal = currentRow[field.key] || '';

          if (oldVal !== newVal) {
            changes.push({
              field: field.label,
              old: oldVal,
              new: newVal
            });
          }
        }

        if (changes.length > 0) {
          changed.push({
            url: currentRow.url,
            changes
          });
        }
      }
    }

    return {
      summary: {
        previousDate: PathManager.formatTimestamp(previousTimestamp),
        currentDate: PathManager.formatTimestamp(currentTimestamp),
        previousFolder: previousCrawl.folderName,
        previousTotal: previousData.size,
        currentTotal: currentData.size,
        added: added.length,
        removed: removed.length,
        changed: changed.length
      },
      details: {
        added,
        removed,
        changed
      }
    };
  }
}

module.exports = new ComparisonProcessor();
