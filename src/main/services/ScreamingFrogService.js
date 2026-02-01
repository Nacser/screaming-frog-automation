const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const CommandBuilder = require('../utils/CommandBuilder');
const PathManager = require('../utils/PathManager');
const Logger = require('../utils/Logger');

class ScreamingFrogService {

  /**
   * Ejecuta un rastreo nuevo.
   * @param {object} options  { url, configFile, exportOptions }
   * @param {function} onProgress  callback (string) para reportar fase
   * @returns {object} { outputPath, baseName }
   */
  async executeCrawl(options, onProgress = () => {}) {
    const { url, configFile, exportOptions } = options;

    Logger.info('Iniciando rastreo', { url });

    // 1. Validar que SF existe
    onProgress('Verificando Screaming Frog...');
    await PathManager.validateScreamingFrogPath();

    // 2. Crear carpeta de salida
    onProgress('Preparando carpeta de salida...');
    const { outputPath, baseName } = await PathManager.createOutputDirectory(url);

    // 3. Construir y ejecutar comando
    onProgress('Ejecutando rastreo...');
    const command = CommandBuilder.buildCrawlCommand({
      url, configFile, exportOptions, outputPath, baseName
    });

    Logger.info('Comando a ejecutar', { command });

    const startTime = Date.now();
    try {
      const { stdout, stderr } = await execPromise(command, CommandBuilder.buildExecOptions());
      if (stderr) Logger.warn('SF stderr', { stderr: stderr.substring(0, 500) });

      const duration = Date.now() - startTime;
      Logger.success('Rastreo completado', { outputPath, duration });

      return { outputPath, baseName, duration };

    } catch (err) {
      // exec rechaza si el proceso sale con código != 0
      Logger.error('Error ejecutando SF CLI', err);
      throw new Error(`Screaming Frog falló: ${err.stderr || err.message}`);
    }
  }

  /**
   * Procesa un archivo .seospider existente.
   * @param {object} options  { filePath, exportOptions }
   * @param {function} onProgress
   * @returns {object} { outputPath, baseName }
   */
  async processExistingCrawl(options, onProgress = () => {}) {
    const { filePath, exportOptions } = options;

    Logger.info('Procesando rastreo existente', { filePath });

    // 1. Validar SF y archivo
    onProgress('Verificando archivos...');
    await PathManager.validateScreamingFrogPath();

    const fs = require('fs').promises;
    await fs.access(filePath); // Lanza si no existe

    // 2. Derivar URL ficticia del nombre del archivo para nombrar la carpeta
    //    Nombre esperado: "dominio_YYYYMMDD_HHMMSS.seospider"
    const fileName = require('path').basename(filePath, '.seospider');
    const domainPart = fileName.split('_')[0] || 'unknown';
    const fakeUrl = `https://${domainPart}.com`;

    onProgress('Preparando carpeta de salida...');
    const { outputPath, baseName } = await PathManager.createOutputDirectory(fakeUrl);

    // 3. Ejecutar
    onProgress('Procesando archivo...');
    const command = CommandBuilder.buildProcessCommand({
      filePath, exportOptions, outputPath
    });

    Logger.info('Comando a ejecutar', { command });

    const startTime = Date.now();
    try {
      const { stdout, stderr } = await execPromise(command, CommandBuilder.buildExecOptions());
      if (stderr) Logger.warn('SF stderr', { stderr: stderr.substring(0, 500) });

      const duration = Date.now() - startTime;
      Logger.success('Procesado completado', { outputPath, duration });

      return { outputPath, baseName, duration };

    } catch (err) {
      Logger.error('Error ejecutando SF CLI (proceso existente)', err);
      throw new Error(`Screaming Frog falló: ${err.stderr || err.message}`);
    }
  }
}

module.exports = new ScreamingFrogService();