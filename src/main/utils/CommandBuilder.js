const ConfigService = require('../services/ConfigService');
const Logger = require('./Logger');
const EXPORT_OPTIONS = require('../constants/exportOptions');

class CommandBuilder {

  /**
   * Construye el comando CLI para un rastreo nuevo.
   * Screaming Frog CLI guarda el archivo .seospider en --output-folder
   * con el nombre que le da --project-name (si se especifica).
   */
  static buildCrawlCommand({ url, configFile, exportOptions, outputPath, baseName }) {
    const { screamingFrogPath } = ConfigService.getPaths();
    const cliOpts = ConfigService.get('cliOptions') || {};

    const parts = [];

    parts.push(`"${screamingFrogPath}"`);
    parts.push(`--crawl "${url}"`);
    parts.push(`--output-folder "${outputPath}"`);

    if (configFile) {
      parts.push(`--config "${configFile}"`);
    }

    // Export Tabs
    const tabs = this._buildExportTabs(exportOptions?.exportTabs);
    if (tabs.length > 0) {
      parts.push(`--export-tabs "${tabs.join(',')}"`);
    }

    // Bulk Exports
    const bulks = this._buildBulkExports(exportOptions?.bulkExports);
    if (bulks.length > 0) {
      parts.push(`--bulk-export "${bulks.join(',')}"`);
    }

    // Opciones de ejecución
    if (cliOpts.headless !== false) parts.push('--headless');
    if (cliOpts.saveCrawl !== false) {
      parts.push('--save-crawl');
      parts.push(`--project-name "${baseName}"`);
    }

    const fmt = cliOpts.exportFormat || 'xlsx';
    parts.push(`--export-format "${fmt}"`);

    const cmd = parts.join(' ');
    Logger.info('Comando construido', { cmd });
    return cmd;
  }

  /**
   * Construye el comando CLI para procesar un archivo .seospider existente.
   */
  static buildProcessCommand({ filePath, exportOptions, outputPath }) {
    const { screamingFrogPath } = ConfigService.getPaths();
    const cliOpts = ConfigService.get('cliOptions') || {};

    const parts = [];

    parts.push(`"${screamingFrogPath}"`);
    parts.push(`--open-project "${filePath}"`);
    parts.push(`--output-folder "${outputPath}"`);

    // Export Tabs
    const tabs = this._buildExportTabs(exportOptions?.exportTabs);
    if (tabs.length > 0) {
      parts.push(`--export-tabs "${tabs.join(',')}"`);
    }

    // Bulk Exports
    const bulks = this._buildBulkExports(exportOptions?.bulkExports);
    if (bulks.length > 0) {
      parts.push(`--bulk-export "${bulks.join(',')}"`);
    }

    if (cliOpts.headless !== false) parts.push('--headless');

    const fmt = cliOpts.exportFormat || 'xlsx';
    parts.push(`--export-format "${fmt}"`);

    const cmd = parts.join(' ');
    Logger.info('Comando de procesado construido', { cmd });
    return cmd;
  }

  /** Opciones para child_process.exec */
  static buildExecOptions() {
    const cliOpts = ConfigService.get('cliOptions') || {};
    return {
      maxBuffer: cliOpts.maxBuffer || 1024 * 1024 * 50,
      timeout:   0,  // Sin timeout por defecto; SF puede tardar mucho en sitios grandes
      windowsHide: true
    };
  }

  /**
   * Convierte objeto exportTabs en array de valores CLI
   * Formato entrada: { internal: { all: true, html: false }, external: { all: true } }
   */
  static _buildExportTabs(exportTabs) {
    if (!exportTabs) return [];

    const tabs = [];

    for (const [groupKey, filters] of Object.entries(exportTabs)) {
      const groupDef = EXPORT_OPTIONS.exportTabs[groupKey];
      if (!groupDef || !groupDef.filters) continue;

      for (const [filterKey, isSelected] of Object.entries(filters)) {
        if (isSelected && groupDef.filters[filterKey]) {
          tabs.push(groupDef.filters[filterKey].cliValue);
        }
      }
    }

    return tabs;
  }

  /**
   * Convierte objeto bulkExports en array de valores CLI
   * Formato entrada: { links: { allInlinks: true, allOutlinks: true } }
   */
  static _buildBulkExports(bulkExports) {
    if (!bulkExports) return [];

    const exports = [];

    for (const [groupKey, items] of Object.entries(bulkExports)) {
      const groupDef = EXPORT_OPTIONS.bulkExports[groupKey];
      if (!groupDef || !groupDef.items) continue;

      for (const [itemKey, isSelected] of Object.entries(items)) {
        if (isSelected && groupDef.items[itemKey]) {
          exports.push(groupDef.items[itemKey].cliValue);
        }
      }
    }

    return exports;
  }
}

module.exports = CommandBuilder;
