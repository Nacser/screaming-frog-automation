const { app } = require('electron');
const path = require('path');

// Asegurar que las rutas relativas resuelvan desde la carpeta del proyecto
// Esto evita problemas cuando se ejecuta desde dist/
app.setAppUserModelId('com.sfautomation.app');

let mainWindow;

async function initialize() {
  try {
    // 1. Logger primero, para capturar todo desde el inicio
    const Logger = require('./src/main/utils/Logger');
    Logger.info('=== Iniciando aplicación v2.1.0 ===');

    // 2. ConfigService: carga o genera configuración
    const ConfigService = require('./src/main/services/ConfigService');
    await ConfigService.initialize();
    Logger.info('ConfigService listo');

    // 3. Registrar todos los handlers IPC antes de crear la ventana
    const IPCManager = require('./src/main/ipc/IPCManager');
    IPCManager.registerAll();
    Logger.info('Handlers IPC registrados');

    // 4. SchedulerService: inicializar Y cargar tareas persistidas
    const SchedulerService = require('./src/main/services/SchedulerService');
    await SchedulerService.initialize();
    await SchedulerService.loadScheduledJobs();
    Logger.info('SchedulerService listo');

    // 5. Crear ventana principal (último paso)
    const MainWindow = require('./src/main/windows/MainWindow');
    mainWindow = new MainWindow();
    await mainWindow.create();
    Logger.info('Ventana principal creada');

  } catch (error) {
    console.error('Error crítico al iniciar:', error);
    app.quit();
  }
}

app.whenReady().then(initialize);

app.on('activate', () => {
  // macOS: reabrir ventana al hacer clic en el icono del dock
  if (mainWindow && mainWindow.isDestroyed()) {
    const MainWindow = require('./src/main/windows/MainWindow');
    mainWindow = new MainWindow();
    mainWindow.create();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    const SchedulerService = require('./src/main/services/SchedulerService');
    SchedulerService.cancelAllJobs();
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  try {
    const Logger = require('./src/main/utils/Logger');
    Logger.error('Excepción no capturada', error);
  } catch (e) {
    console.error('Excepción no capturada:', error);
  }
});

process.on('unhandledRejection', (reason) => {
  try {
    const Logger = require('./src/main/utils/Logger');
    Logger.error('Promesa rechazada no manejada', { reason: String(reason) });
  } catch (e) {
    console.error('Promesa rechazada:', reason);
  }
});