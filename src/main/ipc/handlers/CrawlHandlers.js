const { ipcMain, BrowserWindow } = require('electron');
const ScreamingFrogService      = require('../../services/ScreamingFrogService');
const InternalUrlProcessor      = require('../../processors/InternalUrlProcessor');
const PDFGenerator              = require('../../processors/PDFGenerator');
const ComparisonProcessor       = require('../../processors/ComparisonProcessor');
const ComparisonPDFGenerator    = require('../../processors/ComparisonPDFGenerator');
const PathManager               = require('../../utils/PathManager');
const Logger                    = require('../../utils/Logger');

class CrawlHandlers {
  static register() {

    ipcMain.handle('crawl:start', async (event, crawlData) => {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        const emit = (phase) => {
          if (win && !win.isDestroyed()) win.webContents.send('crawl:phase', phase);
        };

        // 1. Preparar entorno
        emit('Preparando entorno...');
        await PathManager.ensureDirectories();

        // 2. Ejecutar SF según modo
        let result;
        if (crawlData.mode === 'url') {
          result = await ScreamingFrogService.executeCrawl(crawlData, emit);
        } else {
          result = await ScreamingFrogService.processExistingCrawl(crawlData, emit);
        }

        const { outputPath, baseName, duration } = result;

        // 3. Obtener archivos exportados por SF
        emit('Recopilando archivos exportados...');
        const exportedFiles = await PathManager.listFiles(outputPath, '.xlsx');

        // 4. Procesamiento adicional
        let stats = null;
        if (crawlData.processOptions && crawlData.processOptions.internalAnalysis) {
          try {
            emit('Procesando análisis de URLs internas...');
            const analysisResult = await InternalUrlProcessor.process(outputPath, baseName);

            if (analysisResult) {
              stats = analysisResult.stats;

              emit('Generando informe PDF...');
              await PDFGenerator.generate(outputPath, baseName);
            }
          } catch (procErr) {
            // No abortar todo por un error de procesamiento
            Logger.warn('Error en procesamiento adicional (no crítico)', procErr);
            emit('Advertencia: el procesamiento adicional tuvo un error, pero el rastreo se completó.');
          }
        }

        // 5. Comparación con rastreo anterior
        if (crawlData.processOptions && crawlData.processOptions.comparison) {
          try {
            emit('Buscando rastreo anterior...');
            const domain = PathManager.extractDomain(crawlData.url || '');
            const previousCrawl = await PathManager.findPreviousCrawl(domain, baseName);

            if (previousCrawl) {
              emit('Comparando con rastreo anterior...');
              const compResult = await ComparisonProcessor.compare(outputPath, previousCrawl, baseName);

              if (compResult) {
                emit('Generando PDF de comparación...');
                await ComparisonPDFGenerator.generate(outputPath, baseName, compResult);
                Logger.success('Comparación completada', {
                  added: compResult.summary.added,
                  removed: compResult.summary.removed,
                  changed: compResult.summary.changed
                });
              }
            } else {
              Logger.info('No se encontró rastreo anterior para comparar', { domain });
              emit('No se encontró rastreo anterior para comparar');
            }
          } catch (compErr) {
            Logger.warn('Error en comparación (no crítico)', compErr);
            emit('Advertencia: la comparación tuvo un error, pero el rastreo se completó.');
          }
        }

        // 6. Lista final de archivos (xlsx + pdf)
        const allFiles = await PathManager.listFiles(outputPath);
        const finalFiles = allFiles.filter(f =>
          f.toLowerCase().endsWith('.xlsx') || f.toLowerCase().endsWith('.pdf')
        );

        emit('Proceso completado');

        return {
          success: true,
          outputPath,
          baseName,
          duration,
          files: finalFiles,
          stats
        };

      } catch (err) {
        Logger.error('crawl:start error', err);
        return { success: false, error: err.message };
      }
    });
  }
}

module.exports = CrawlHandlers;