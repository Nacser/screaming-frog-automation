const schedule = require('node-schedule');
const { app, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/Logger');

class SchedulerService {
  constructor() {
    this.jobs = new Map();          // id → node-schedule Job
    this.jobData = [];              // array de datos persistidos
    this.persistPath = null;
  }

  async initialize() {
    this.persistPath = path.join(app.getPath('userData'), 'scheduled_jobs.json');
    Logger.info('SchedulerService inicializado');
  }

  /** Carga tareas desde disco y las reprograma */
  async loadScheduledJobs() {
    if (!this.persistPath) await this.initialize();

    try {
      const raw = await fs.readFile(this.persistPath, 'utf8');
      this.jobData = JSON.parse(raw);
    } catch (e) {
      // No existe archivo → empezar con lista vacía
      this.jobData = [];
    }

    // Reprogramar las que estaban activas
    for (const item of this.jobData) {
      if (item.status === 'active') {
        this._createNodeScheduleJob(item);
      }
    }

    Logger.info('Tareas programadas cargadas', { total: this.jobData.length });
  }

  /** Guarda lista de tareas en disco */
  async _persist() {
    try {
      await fs.writeFile(this.persistPath, JSON.stringify(this.jobData, null, 2), 'utf8');
    } catch (e) {
      Logger.error('Error persistiendo tareas programadas', e);
    }
  }

  /**
   * Añade una nueva tarea programada.
   * @param {object} jobInfo  { id, date, time, frequency, crawlConfig }
   */
  async addJob(jobInfo) {
    try {
      const validation = this.validateSchedule(jobInfo.date, jobInfo.time);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const entry = { ...jobInfo, status: 'active' };
      this.jobData.push(entry);

      const job = this._createNodeScheduleJob(entry);
      if (!job) {
        // Si node-schedule no pudo crear el job (fecha pasada, etc.)
        entry.status = 'error';
        await this._persist();
        return { success: false, error: 'No se pudo crear la tarea programada' };
      }

      await this._persist();
      Logger.success('Tarea programada añadida', { id: jobInfo.id, next: job.nextInvocation() });
      return { success: true, nextRun: job.nextInvocation() };

    } catch (e) {
      Logger.error('Error añadiendo tarea', e);
      return { success: false, error: e.message };
    }
  }

  /** Cancela una tarea (la deja en lista pero inactiva) */
  async cancelJob(id) {
    this._cancelNodeJob(id);

    const entry = this.jobData.find(j => j.id === id);
    if (entry) entry.status = 'cancelled';

    await this._persist();
    Logger.info('Tarea cancelada', { id });
    return { success: true };
  }

  /** Elimina una tarea completamente */
  async deleteJob(id) {
    this._cancelNodeJob(id);
    this.jobData = this.jobData.filter(j => j.id !== id);
    await this._persist();
    Logger.info('Tarea eliminada', { id });
    return { success: true };
  }

  /** Actualiza el nombre de una tarea */
  async updateJobName(id, newName) {
    const entry = this.jobData.find(j => j.id === id);
    if (!entry) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    entry.name = newName || null;
    await this._persist();
    Logger.info('Nombre actualizado', { id, newName });
    return { success: true };
  }

  /** Actualiza la frecuencia de una tarea */
  async updateJobFrequency(id, newFrequency) {
    const entry = this.jobData.find(j => j.id === id);
    if (!entry) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    // Cancelar job actual
    this._cancelNodeJob(id);

    // Actualizar frecuencia
    entry.frequency = newFrequency;

    // Recrear job con nuevo patrón si está activa
    if (entry.status === 'active') {
      const job = this._createNodeScheduleJob(entry);
      if (!job) {
        Logger.warn('No se pudo recrear el job con nueva frecuencia', { id, newFrequency });
      }
    }

    await this._persist();
    Logger.info('Frecuencia actualizada', { id, newFrequency });

    const job = this.jobs.get(id);
    return { success: true, nextRun: job ? job.nextInvocation() : null };
  }

  /** Retorna todas las tareas con info de próxima ejecución */
  getAllJobs() {
    return this.jobData.map(entry => {
      const job = this.jobs.get(entry.id);
      return {
        ...entry,
        nextRun: job ? job.nextInvocation() : null,
        isActive: this.jobs.has(entry.id)
      };
    });
  }

  /** Cancela todos los jobs de node-schedule (p.ej. al cerrar la app) */
  async cancelAllJobs() {
    for (const job of this.jobs.values()) {
      job.cancel();
    }
    this.jobs.clear();
    Logger.info('Todos los jobs cancelados');
  }

  /** Valida que la fecha+hora sean futuras */
  validateSchedule(date, time) {
    if (!date || !time) return { valid: false, error: 'Fecha y hora son requeridas' };
    try {
      const target = new Date(`${date}T${time}`);
      if (isNaN(target.getTime())) return { valid: false, error: 'Formato de fecha/hora inválido' };
      if (target <= new Date()) return { valid: false, error: 'La fecha y hora deben ser futuras' };
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Error parseando fecha' };
    }
  }

  // ──────────────────────────────────────────
  // Métodos internos
  // ──────────────────────────────────────────

  /** Crea el Job de node-schedule y lo guarda en this.jobs */
  _createNodeScheduleJob(entry) {
    const pattern = this._buildPattern(entry.date, entry.time, entry.frequency);

    const job = schedule.scheduleJob(pattern, async () => {
      Logger.info('Ejecutando tarea programada', { id: entry.id, url: entry.crawlConfig?.url });
      try {
        const win = BrowserWindow.getAllWindows()[0];
        if (win && !win.isDestroyed()) {
          win.webContents.send('scheduled-crawl-start', {
            id: entry.id,
            crawlConfig: entry.crawlConfig
          });
        } else {
          Logger.warn('No hay ventana disponible para ejecutar tarea programada', { id: entry.id });
        }

        // Si es "una vez", eliminar la tarea después de ejecutarse
        if (entry.frequency === 'once') {
          Logger.info('Eliminando tarea de frecuencia única', { id: entry.id });
          await this.deleteJob(entry.id);
          // Notificar al renderer para que actualice la lista
          if (win && !win.isDestroyed()) {
            win.webContents.send('scheduled-job-deleted', { id: entry.id });
          }
        }
      } catch (e) {
        Logger.error('Error en callback de tarea programada', e);
      }
    });

    if (job) {
      this.jobs.set(entry.id, job);
    }
    return job;
  }

  /** Cancela el Job de node-schedule por id */
  _cancelNodeJob(id) {
    const job = this.jobs.get(id);
    if (job) {
      job.cancel();
      this.jobs.delete(id);
    }
  }

  /** Construye el patrón que consume node-schedule */
  _buildPattern(date, time, frequency) {
    const d = new Date(`${date}T${time}`);

    switch (frequency) {
      case 'daily':
        return { hour: d.getHours(), minute: d.getMinutes(), second: 0 };
      case 'weekly':
        return { dayOfWeek: d.getDay(), hour: d.getHours(), minute: d.getMinutes(), second: 0 };
      case 'monthly':
        return { date: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: 0 };
      case 'once':
      default:
        return d; // Fecha exacta → se ejecuta una sola vez
    }
  }
}

module.exports = new SchedulerService();