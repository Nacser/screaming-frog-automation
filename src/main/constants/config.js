const path = require('path');
const os = require('os');

module.exports = {
  // Rutas
  screamingFrogPath: process.platform === 'win32'
    ? 'C:\\Program Files\\Screaming Frog SEO Spider\\ScreamingFrogSEOSpiderCli.exe'
    : '/Applications/Screaming Frog SEO Spider.app/Contents/MacOS/ScreamingFrogSEOSpiderCli',
  outputFolder: path.join(os.homedir(), 'SF_Output'),
  configFolder: path.join(os.homedir(), 'SF_Configs'),
  tempFolder: path.join(os.homedir(), 'SF_Temp'),

  // Opciones de exportación por defecto
  defaultExportOptions: {
    internal: true,
    external: true,
    images: false,
    css: false,
    javascript: false,
    redirects: false,
    links: false,
    anchors: false
  },

  // Opciones de procesado por defecto
  defaultProcessOptions: {
    internalAnalysis: true
  },

  // Opciones de ejecución del CLI
  cliOptions: {
    headless: true,
    saveCrawl: true,
    exportFormat: 'xlsx',
    maxBuffer: 1024 * 1024 * 50 // 50MB
  },

  // Programador
  schedulerOptions: {
    timezone: 'Europe/Madrid',
    maxConcurrentJobs: 3
  }
};