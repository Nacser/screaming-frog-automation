const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    this.logPath = null;
    this._initialize();
  }

  _initialize() {
    try {
      const logsDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const date = new Date().toISOString().split('T')[0];
      this.logPath = path.join(logsDir, `app_${date}.log`);
    } catch (e) {
      console.error('Logger: no se pudo crear directorio de logs', e);
    }
  }

  _format(level, message, data) {
    const ts = new Date().toISOString();
    let line = `[${ts}] [${level}] ${message}`;
    if (data !== undefined && data !== null) {
      try {
        line += ` | ${JSON.stringify(data)}`;
      } catch (e) {
        line += ` | [datos no serializables]`;
      }
    }
    return line;
  }

  _write(line) {
    if (this.logPath) {
      try {
        fs.appendFileSync(this.logPath, line + '\n');
      } catch (e) {
        // Silenciar errores de escritura de log para no crear bucles
      }
    }
  }

  info(msg, data) {
    const line = this._format('INFO', msg, data);
    console.log(line);
    this._write(line);
  }

  warn(msg, data) {
    const line = this._format('WARN', msg, data);
    console.warn(line);
    this._write(line);
  }

  error(msg, err) {
    // Extraer info útil del error
    let data = err;
    if (err instanceof Error) {
      data = { message: err.message, stack: err.stack };
    }
    const line = this._format('ERROR', msg, data);
    console.error(line);
    this._write(line);
  }

  success(msg, data) {
    const line = this._format('SUCCESS', msg, data);
    console.log(line);
    this._write(line);
  }

  debug(msg, data) {
    if (process.argv.includes('--dev')) {
      const line = this._format('DEBUG', msg, data);
      console.log(line);
      this._write(line);
    }
  }
}

module.exports = new Logger();