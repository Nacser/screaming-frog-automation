const { ipcMain } = require('electron');
const ConfigService = require('../../services/ConfigService');
const Logger = require('../../utils/Logger');

class ConfigHandlers {
  static register() {

    // Retorna toda la configuración (para poblar la UI de settings)
    ipcMain.handle('config:get', async () => {
      try {
        return { success: true, config: ConfigService.get() };
      } catch (e) {
        Logger.error('config:get', e);
        return { success: false, error: e.message };
      }
    });

    // Guarda SOLO las rutas editables (no clobber de cliOptions, etc.)
    ipcMain.handle('config:savePaths', async (event, paths) => {
      try {
        const result = await ConfigService.updatePaths(paths);
        Logger.info('Rutas actualizadas', paths);
        return result;
      } catch (e) {
        Logger.error('config:savePaths', e);
        return { success: false, error: e.message };
      }
    });
  }
}

module.exports = ConfigHandlers;