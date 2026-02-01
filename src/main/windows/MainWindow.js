const { BrowserWindow } = require('electron');
const path = require('path');

class MainWindow {
  constructor() {
    this.window = null;
  }

  async create() {
    this.window = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1100,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // Necesario para que el renderer pueda require() de node
        devTools: true
      },
      backgroundColor: '#0f172a',
      show: false,
      frame: true
    });

    // Ruta absoluta al HTML, calculada desde la ubicación de este archivo
    // Este archivo está en: src/main/windows/MainWindow.js
    // El HTML está en:      ui/index.html
    // Subimos 3 niveles:    windows → main → src → raíz del proyecto
    const htmlPath = path.resolve(__dirname, '..', '..', '..', 'ui', 'index.html');
    console.log('[MainWindow] Cargando HTML desde:', htmlPath);

    // Capturar errores de carga del renderer
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('[MainWindow] did-fail-load:', { errorCode, errorDescription, validatedURL });
    });

    this.window.webContents.on('render-process-gone', (event, details) => {
      console.error('[MainWindow] render-process-gone:', details);
    });

    this.window.webContents.on('dom-ready', () => {
      console.log('[MainWindow] DOM listo, mostrando ventana');
      // Mostrar la ventana cuando el DOM esté listo
      // (más fiable que ready-to-show en algunos casos)
      if (this.window && !this.window.isDestroyed()) {
        this.window.show();
      }
    });

    this.window.webContents.on('console-message', (event, level, message, line, source) => {
      // Reenviar logs del renderer al terminal principal
      const levels = ['error', 'warn', 'info', 'verbose', 'debug'];
      console.log(`[Renderer ${levels[level] || level}] ${message}`);
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    // DevTools en modo desarrollo
    if (process.argv.includes('--dev')) {
      this.window.webContents.openDevTools();
    }

    // Cargar el archivo HTML
    try {
      await this.window.loadFile(htmlPath);
      console.log('[MainWindow] loadFile completado');
    } catch (err) {
      console.error('[MainWindow] Error en loadFile:', err);
      // Si falla loadFile, mostrar de igual forma para que se vea el error
      if (this.window && !this.window.isDestroyed()) {
        this.window.show();
      }
    }
  }

  isDestroyed() {
    return !this.window || this.window.isDestroyed();
  }
}

module.exports = MainWindow;