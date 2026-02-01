const { ipcMain } = require('electron');
const SchedulerService = require('../../services/SchedulerService');
const Logger = require('../../utils/Logger');

class ScheduleHandlers {
  static register() {

    // Añadir nueva tarea programada
    ipcMain.handle('schedule:add', async (event, jobInfo) => {
      try {
        Logger.info('schedule:add', { url: jobInfo.crawlConfig?.url, date: jobInfo.date, time: jobInfo.time });
        return await SchedulerService.addJob(jobInfo);
      } catch (e) {
        Logger.error('schedule:add', e);
        return { success: false, error: e.message };
      }
    });

    // Cancelar tarea (la deja inactiva pero sigue en la lista)
    ipcMain.handle('schedule:cancel', async (event, id) => {
      try {
        return await SchedulerService.cancelJob(id);
      } catch (e) {
        Logger.error('schedule:cancel', e);
        return { success: false, error: e.message };
      }
    });

    // Eliminar tarea completamente
    ipcMain.handle('schedule:delete', async (event, id) => {
      try {
        return await SchedulerService.deleteJob(id);
      } catch (e) {
        Logger.error('schedule:delete', e);
        return { success: false, error: e.message };
      }
    });

    // Actualizar frecuencia de una tarea
    ipcMain.handle('schedule:updateFrequency', async (event, { id, frequency }) => {
      try {
        return await SchedulerService.updateJobFrequency(id, frequency);
      } catch (e) {
        Logger.error('schedule:updateFrequency', e);
        return { success: false, error: e.message };
      }
    });

    // Actualizar nombre de una tarea
    ipcMain.handle('schedule:updateName', async (event, { id, name }) => {
      try {
        return await SchedulerService.updateJobName(id, name);
      } catch (e) {
        Logger.error('schedule:updateName', e);
        return { success: false, error: e.message };
      }
    });

    // Obtener todas las tareas
    ipcMain.handle('schedule:getAll', async () => {
      try {
        return { success: true, jobs: SchedulerService.getAllJobs() };
      } catch (e) {
        Logger.error('schedule:getAll', e);
        return { success: false, error: e.message };
      }
    });

    // Validar fecha/hora
    ipcMain.handle('schedule:validate', async (event, { date, time }) => {
      return { success: true, validation: SchedulerService.validateSchedule(date, time) };
    });
  }
}

module.exports = ScheduleHandlers;