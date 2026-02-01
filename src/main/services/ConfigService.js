const { app } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const DEFAULT_CONFIG = require('../constants/config');
const Logger = require('../utils/Logger');

// Claves que el usuario puede modificar desde la UI
const USER_EDITABLE_KEYS = [
  'screamingFrogPath',
  'outputFolder',
  'configFolder',
  'tempFolder'
];

class ConfigService {
  constructor() {
    this.config = null;
    this.configPath = null;
  }

  async initialize() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    await this._load();
    Logger.info('ConfigService inicializado', { configPath: this.configPath });
  }

  /**
   * Carga configuración desde disco.
   * Hace deep merge con DEFAULT_CONFIG para que siempre existan
   * todas las claves necesarias (cliOptions, schedulerOptions, etc.)
   */
  async _load() {
    try {
      const raw = await fs.readFile(this.configPath, 'utf8');
      const saved = JSON.parse(raw);
      // Merge: DEFAULT_CONFIG como base, encima lo guardado
      this.config = this._deepMerge(DEFAULT_CONFIG, saved);
      Logger.info('Configuración cargada desde archivo');
    } catch (err) {
      // Si no existe o está corrupto, usar defaults
      Logger.info('Usando configuración por defecto');
      this.config = this._deepMerge({}, DEFAULT_CONFIG);
      await this.save();
    }
  }

  /**
   * Guarda configuración actual en disco
   */
  async save() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      return { success: true };
    } catch (err) {
      Logger.error('Error guardando configuración', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Retorna toda la configuración (copia)
   */
  get(key) {
    if (!this.config) this.config = this._deepMerge({}, DEFAULT_CONFIG);
    return key ? this.config[key] : { ...this.config };
  }

  /**
   * Actualiza SOLO las claves editables por el usuario (las 4 rutas)
   * sin clobbear cliOptions u otras claves internas.
   */
  async updatePaths(newPaths) {
    if (!this.config) this.config = this._deepMerge({}, DEFAULT_CONFIG);

    for (const key of USER_EDITABLE_KEYS) {
      if (newPaths[key] !== undefined) {
        this.config[key] = newPaths[key];
      }
    }

    await this.save();
    return { success: true, config: this.config };
  }

  getPaths() {
    if (!this.config) this.config = this._deepMerge({}, DEFAULT_CONFIG);
    return {
      screamingFrogPath: this.config.screamingFrogPath,
      outputFolder:      this.config.outputFolder,
      configFolder:      this.config.configFolder,
      tempFolder:        this.config.tempFolder
    };
  }

  /**
   * Deep merge: propiedades de `source` sobre `target`
   */
  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object'
      ) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

module.exports = new ConfigService();