const { ipcMain, dialog, shell, BrowserWindow } = require('electron');
const fs = require('fs');
const ConfigService = require('../../services/ConfigService');
const Logger = require('../../utils/Logger');

/** Retorna la carpeta como defaultPath solo si realmente existe en disco */
function safeDefaultPath(dirPath) {
  try {
    if (dirPath && fs.existsSync(dirPath)) return dirPath;
  } catch (e) { /* ignorar */ }
  return undefined; // dialog usará la carpeta por defecto del sistema
}

class FileHandlers {
  static register() {

    // Seleccionar archivo de configuración de Screaming Frog
    ipcMain.handle('file:selectConfig', async (event) => {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        const { configFolder } = ConfigService.getPaths();

        const result = await dialog.showOpenDialog(win, {
          title: 'Seleccionar configuración de Screaming Frog',
          defaultPath: safeDefaultPath(configFolder),
          filters: [
            { name: 'Configuración SF', extensions: ['seospiderconfig'] },
            { name: 'Todos los archivos', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled || !result.filePaths.length) {
          return { success: false, canceled: true };
        }

        Logger.info('Config SF seleccionada', { path: result.filePaths[0] });
        return { success: true, filePath: result.filePaths[0] };

      } catch (e) {
        Logger.error('file:selectConfig', e);
        return { success: false, error: e.message };
      }
    });

    // Seleccionar archivo .seospider existente
    ipcMain.handle('file:selectCrawl', async (event) => {
      try {
        const win = BrowserWindow.fromWebContents(event.sender);
        const { outputFolder } = ConfigService.getPaths();

        const result = await dialog.showOpenDialog(win, {
          title: 'Seleccionar archivo de rastreo',
          defaultPath: safeDefaultPath(outputFolder),
          filters: [
            { name: 'Rastreo SF', extensions: ['seospider'] },
            { name: 'Todos los archivos', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled || !result.filePaths.length) {
          return { success: false, canceled: true };
        }

        Logger.info('Archivo de rastreo seleccionado', { path: result.filePaths[0] });
        return { success: true, filePath: result.filePaths[0] };

      } catch (e) {
        Logger.error('file:selectCrawl', e);
        return { success: false, error: e.message };
      }
    });

    // Abrir carpeta en explorador del sistema
    ipcMain.handle('file:openFolder', async (event, folderPath) => {
      try {
        await shell.openPath(folderPath);
        return { success: true };
      } catch (e) {
        Logger.error('file:openFolder', e);
        return { success: false, error: e.message };
      }
    });

    // Abrir archivo con la aplicación por defecto
    ipcMain.handle('file:open', async (event, filePath) => {
      try {
        await shell.openPath(filePath);
        return { success: true };
      } catch (e) {
        Logger.error('file:open', e);
        return { success: false, error: e.message };
      }
    });
  }
}

module.exports = FileHandlers;