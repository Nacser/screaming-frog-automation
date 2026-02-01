const fs = require('fs').promises;
const path = require('path');
const ConfigService = require('../services/ConfigService');
const Logger = require('./Logger');

class PathManager {

  /** Extrae dominio limpio de una URL: "https://www.ejemplo.co.es/ruta" → "ejemplo" */
  static extractDomain(url) {
    try {
      const { hostname } = new URL(url);
      // Borrar "www."
      const clean = hostname.replace(/^www\./, '');
      // Tomar solo la primera parte (antes del primer punto)
      return clean.split('.')[0] || 'unknown';
    } catch (e) {
      Logger.warn('extractDomain: URL no válida', { url });
      return 'unknown';
    }
  }

  /** Timestamp con formato YYYYMMDD_HHMMSS */
  static getTimestamp() {
    const n = new Date();
    const pad = (v) => String(v).padStart(2, '0');
    return `${n.getFullYear()}${pad(n.getMonth() + 1)}${pad(n.getDate())}_${pad(n.getHours())}${pad(n.getMinutes())}${pad(n.getSeconds())}`;
  }

  /** Nombre base para carpeta y archivos: "ejemplo_20260117_143052" */
  static generateBaseName(url) {
    return `${this.extractDomain(url)}_${this.getTimestamp()}`;
  }

  /**
   * Crea directorio de salida para un rastreo.
   * Retorna { outputPath, baseName }
   */
  static async createOutputDirectory(url) {
    const { outputFolder } = ConfigService.getPaths();
    const baseName = this.generateBaseName(url);
    const outputPath = path.join(outputFolder, baseName);

    await fs.mkdir(outputPath, { recursive: true });
    Logger.info('Directorio de salida creado', { outputPath });
    return { outputPath, baseName };
  }

  /** Asegura que existan las carpetas principales */
  static async ensureDirectories() {
    const { outputFolder, tempFolder, configFolder } = ConfigService.getPaths();
    for (const dir of [outputFolder, tempFolder, configFolder]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /** Valida que el ejecutable de SF existe */
  static async validateScreamingFrogPath() {
    const { screamingFrogPath } = ConfigService.getPaths();
    try {
      await fs.access(screamingFrogPath);
      return true;
    } catch (e) {
      throw new Error(`Screaming Frog CLI no encontrado en:\n${screamingFrogPath}`);
    }
  }

  /** Lista archivos en un directorio, opcionalmente filtrados por extensión */
  static async listFiles(dirPath, ext = null) {
    try {
      const files = await fs.readdir(dirPath);
      return ext ? files.filter(f => f.toLowerCase().endsWith(ext.toLowerCase())) : files;
    } catch (e) {
      Logger.warn('listFiles: error leyendo directorio', { dirPath });
      return [];
    }
  }

  /**
   * Busca la carpeta del rastreo anterior para un dominio dado.
   * @param {string} domain - Dominio a buscar (ej: "ejemplo")
   * @param {string} excludeFolder - Nombre de carpeta actual a excluir (no ruta completa)
   * @returns {object|null} - { path, folderName, timestamp } o null
   */
  static async findPreviousCrawl(domain, excludeFolder = null) {
    const { outputFolder } = ConfigService.getPaths();

    try {
      const allItems = await fs.readdir(outputFolder, { withFileTypes: true });
      const folders = allItems
        .filter(item => item.isDirectory())
        .map(item => item.name);

      // Filtrar carpetas del mismo dominio (empiezan con dominio_)
      const matching = folders
        .filter(f => f.startsWith(domain + '_') && f !== excludeFolder)
        .sort()
        .reverse(); // Más reciente primero (por orden alfabético del timestamp)

      if (matching.length === 0) {
        Logger.info('No se encontró rastreo anterior', { domain });
        return null;
      }

      const folderName = matching[0];
      // Extraer timestamp del nombre: dominio_YYYYMMDD_HHMMSS
      const timestampPart = folderName.replace(domain + '_', '');

      Logger.info('Rastreo anterior encontrado', { folder: folderName });
      return {
        path: path.join(outputFolder, folderName),
        folderName,
        timestamp: timestampPart
      };
    } catch (e) {
      Logger.warn('Error buscando rastreo anterior', { domain, error: e.message });
      return null;
    }
  }

  /**
   * Formatea un timestamp YYYYMMDD_HHMMSS a fecha legible
   */
  static formatTimestamp(timestamp) {
    if (!timestamp || timestamp.length < 15) return timestamp;
    // YYYYMMDD_HHMMSS -> DD/MM/YYYY HH:MM:SS
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const min = timestamp.substring(11, 13);
    const sec = timestamp.substring(13, 15);
    return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
  }
}

module.exports = PathManager;